import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { createHash } from 'crypto';

@Injectable()
export class GamesApiCallbackService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
    ) { }

    private get hallId() {
        return process.env.GAMES_API_HALL_ID || '';
    }

    private get hallKey() {
        return process.env.GAMES_API_HALL_KEY || '';
    }

    private formatBalance(user: User) {
        return Number(user.balance || 0).toFixed(2);
    }

    private normalizeLogin(value: any) {
        return String(value ?? '').trim();
    }

    private async findUser(login: string) {
        if (!login) return null;
        const byEmail = await this.usersService.findByEmail(login);
        if (byEmail) return byEmail;
        if (/^\d+$/.test(login)) {
            return this.usersService.findById(Number(login));
        }
        return null;
    }

    private buildSignature(payload: Record<string, any>) {
        if (!this.hallKey) return '';
        const entries = Object.entries(payload)
            .filter(([key]) => key !== 'sign' && key !== 'key')
            .sort(([a], [b]) => a.localeCompare(b));
        const values = entries.map(([, value]) => String(value));
        values.push(this.hallKey);
        return createHash('sha256').update(values.join(':')).digest('hex');
    }

    private validateAuth(payload: Record<string, any>) {
        if (this.hallId && String(payload.hall ?? '') !== String(this.hallId)) {
            return false;
        }
        if (payload.sign) {
            const expected = this.buildSignature(payload);
            return expected && expected === String(payload.sign);
        }
        if (!this.hallKey) return true;
        return String(payload.key ?? '') === String(this.hallKey);
    }

    private fail(error: string) {
        return { status: 'fail', error };
    }

    async handle(payload: Record<string, any>) {
        const cmd = String(payload?.cmd || '').trim();
        if (!cmd) return this.fail('fail_response');
        if (!this.validateAuth(payload)) return this.fail('fail_response');

        if (cmd === 'getBalance') {
            return this.handleGetBalance(payload);
        }
        if (cmd === 'writeBet') {
            return this.handleWriteBet(payload);
        }
        return this.fail('fail_response');
    }

    private async handleGetBalance(payload: Record<string, any>) {
        const login = this.normalizeLogin(payload.login);
        const user = await this.findUser(login);
        if (!user) return this.fail('user_not_found');
        return {
            status: 'success',
            error: '',
            login,
            balance: this.formatBalance(user),
            currency: user.currency,
        };
    }

    private parseDecimal(value: any) {
        const raw = String(value ?? '').trim();
        if (!raw) return null;
        const numeric = Number(raw);
        if (!Number.isFinite(numeric) || numeric < 0) return null;
        return new Prisma.Decimal(raw);
    }

    private async handleWriteBet(payload: Record<string, any>) {
        const login = this.normalizeLogin(payload.login);
        const user = await this.findUser(login);
        if (!user) return this.fail('user_not_found');

        const betValue = this.parseDecimal(payload.bet ?? 0);
        const winValue = this.parseDecimal(payload.win ?? 0);
        if (!betValue || !winValue) return this.fail('fail_response');

        const betInfo = String(payload.betInfo ?? '').toLowerCase();
        const isRefund = betInfo.includes('refund');
        const delta = winValue.minus(betValue);

        return this.prisma.$transaction(async (tx) => {
            const current = await tx.user.findUnique({ where: { id: user.id } });
            if (!current) return this.fail('user_not_found');
            if (!isRefund && Number(current.balance) < Number(betValue)) {
                return this.fail('fail_balance');
            }
            const updated = await tx.user.update({
                where: { id: user.id },
                data: { balance: { increment: delta } },
            });
            await tx.game.create({
                data: {
                    userId: user.id,
                    type: String(payload.gameId ?? payload.action ?? 'game'),
                    bet: betValue,
                    win: winValue,
                },
            });
            await tx.actionLog.create({
                data: {
                    userId: user.id,
                    action: 'gamesapi.writeBet',
                    meta: {
                        sessionId: payload.sessionId,
                        tradeId: payload.tradeId,
                        action: payload.action,
                        gameId: payload.gameId,
                        bet: String(betValue),
                        win: String(winValue),
                        roundFinished: payload.round_finished,
                    },
                },
            });
            return {
                status: 'success',
                error: '',
                login,
                balance: this.formatBalance(updated),
                currency: updated.currency,
            };
        });
    }
}
