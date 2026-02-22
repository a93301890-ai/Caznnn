import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BetsService {
    constructor(private prisma: PrismaService) { }

    async placeBet(params: {
        userId: number;
        type: 'SINGLE' | 'EXPRESS' | 'SYSTEM';
        stake: number;
        selections: Array<{
            eventId?: number;
            eventName: string;
            market: string;
            odd: number;
            outcome?: string;
        }>;
    }) {
        if (!params.selections.length) {
            throw new BadRequestException('Selections required');
        }
        const totalOdds = params.selections.reduce((acc, s) => acc * s.odd, 1);
        const potentialWin = params.stake * totalOdds;
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: params.userId } });
            if (!user) throw new BadRequestException('User not found');
            if (Number(user.balance) < params.stake) {
                throw new BadRequestException('Insufficient funds');
            }
            await tx.user.update({
                where: { id: params.userId },
                data: { balance: { decrement: params.stake } },
            });
            const bet = await tx.bet.create({
                data: {
                    userId: params.userId,
                    type: params.type,
                    stake: params.stake,
                    totalOdds,
                    potentialWin,
                    selections: {
                        create: params.selections.map((s) => ({
                            eventId: s.eventId,
                            eventName: s.eventName,
                            market: s.market,
                            odd: s.odd,
                            outcome: s.outcome,
                        })),
                    },
                },
                include: { selections: true },
            });
            return bet;
        });
    }

    listUserBets(userId: number, status?: string) {
        return this.prisma.bet.findMany({
            where: { userId, status: status as any },
            include: { selections: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async settleBet(id: number, status: 'WON' | 'LOST' | 'VOID') {
        return this.prisma.$transaction(async (tx) => {
            const bet = await tx.bet.findUnique({
                where: { id },
                include: { user: true },
            });
            if (!bet) throw new BadRequestException('Bet not found');
            const updated = await tx.bet.update({
                where: { id },
                data: { status, settledAt: new Date() },
            });
            if (status === 'WON') {
                await tx.user.update({
                    where: { id: bet.userId },
                    data: { balance: { increment: Number(bet.potentialWin) } },
                });
            }
            return updated;
        });
    }
}
