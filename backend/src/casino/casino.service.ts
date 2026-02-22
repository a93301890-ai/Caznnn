import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomInt } from 'crypto';
const casinoHubImageBase =
    'https://raw.githubusercontent.com/cornel-pe/casino-hub/main/src/assets/images';
const casinoHubImages = [
    14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
];
const casinoHubNames = [
    'Sweet Bonanza',
    'Wanted Dead or a Wild',
    'Gates of Olympus',
    'Fruit Party',
    'Sugar Rush',
    'Plinko',
];
const casinoHubDemos = ['/slots/midas.html', '/slots/fantasy.html', '/slots/adventure.html'];
const slots = casinoHubImages.map((index, idx) => ({
    id: `casino-hub-${index}`,
    name: casinoHubNames[idx] ?? `Casino Hub ${index}`,
    provider: 'Casino Hub',
    category: 'Slots',
    image: `${casinoHubImageBase}/IMAGE%20(${index}).png`,
    demoUrl: casinoHubDemos[idx % casinoHubDemos.length],
}));

@Injectable()
export class CasinoService {
    constructor(private prisma: PrismaService) { }

    private arcadeRounds = new Map();

    private nextRoundId() {
        return `${Date.now().toString(36)}-${randomInt(0, 1e9).toString(36)}`;
    }

    private randomFloat() {
        return randomInt(0, 1_000_000) / 1_000_000;
    }

    private pickWeighted(weights: number[]) {
        const total = weights.reduce((sum, value) => sum + value, 0);
        let roll = this.randomFloat() * total;
        for (let i = 0; i < weights.length; i += 1) {
            roll -= weights[i];
            if (roll <= 0) return i;
        }
        return weights.length - 1;
    }

    private binomialWeights(size: number) {
        const weights = new Array(size).fill(0);
        weights[0] = 1;
        for (let i = 1; i < size; i += 1) {
            weights[i] = (weights[i - 1] * (size - i)) / i;
        }
        return weights;
    }

    private expectedMultiplier(multipliers: number[], weights: number[]) {
        const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
        const weighted = multipliers.reduce((sum, value, idx) => sum + value * (weights[idx] || 0), 0);
        return weighted / totalWeight;
    }

    private rouletteColor(number: number) {
        const redSet = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
        if (number === 0) return 'green';
        return redSet.has(number) ? 'red' : 'black';
    }

    listSlots() {
        return slots;
    }

    async spin(userId: number, slotId: string, bet: number) {
        const slot = slots.find((s) => s.id === slotId);
        if (!slot) throw new BadRequestException('Slot not found');
        if (!Number.isFinite(bet) || bet <= 0) {
            throw new BadRequestException('Invalid bet');
        }
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new BadRequestException('User not found');
            if (Number(user.balance) < bet) {
                throw new BadRequestException('Insufficient funds');
            }
            const multiplier = Math.random() < 0.15 ? 3 : Math.random() < 0.35 ? 1.5 : 0;
            const win = bet * multiplier;
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: bet } },
            });
            if (win > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { balance: { increment: win } },
                });
            }
            await tx.game.create({
                data: {
                    userId,
                    type: slot.id,
                    bet,
                    win,
                },
            });
            return { slot, bet, win };
        });
    }

    async arcadeBet(userId: number, game: string, bet: number) {
        if (!game) throw new BadRequestException('Game not set');
        if (!Number.isFinite(bet) || bet <= 0) {
            throw new BadRequestException('Invalid bet');
        }
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new BadRequestException('User not found');
            if (Number(user.balance) < bet) {
                throw new BadRequestException('Insufficient funds');
            }
            const updated = await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: bet } },
            });
            await tx.game.create({
                data: {
                    userId,
                    type: `arcade:${game}`,
                    bet,
                    win: 0,
                },
            });
            return { balance: updated.balance };
        });
    }

    async arcadePayout(userId: number, game: string, amount: number) {
        if (!game) throw new BadRequestException('Game not set');
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('Invalid payout');
        }
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new BadRequestException('User not found');
            const updated = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } },
            });
            await tx.game.create({
                data: {
                    userId,
                    type: `arcade:${game}`,
                    bet: 0,
                    win: amount,
                },
            });
            return { balance: updated.balance };
        });
    }

    async arcadeRound(userId: number, payload: any) {
        const game = String(payload?.game || '').toLowerCase();
        const action = String(payload?.action || 'spin').toLowerCase();
        const bet = Number(payload?.bet || 0);
        const roundId = payload?.roundId ? String(payload.roundId) : '';
        const meta = payload?.payload || {};

        if (!game) throw new BadRequestException('Game not set');

        const applySingleRound = async (win: number, data: any) =>
            this.prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) throw new BadRequestException('User not found');
                if (!Number.isFinite(bet) || bet <= 0) {
                    throw new BadRequestException('Invalid bet');
                }
                if (Number(user.balance) < bet) {
                    throw new BadRequestException('Insufficient funds');
                }
                await tx.user.update({
                    where: { id: userId },
                    data: { balance: { decrement: bet } },
                });
                if (win > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { balance: { increment: win } },
                    });
                }
                const updated = await tx.user.findUnique({ where: { id: userId } });
                await tx.game.create({
                    data: {
                        userId,
                        type: `arcade:${game}`,
                        bet,
                        win,
                    },
                });
                return { balance: Number(updated?.balance || 0), win, ...data };
            });

        const startRound = async (data: any) =>
            this.prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) throw new BadRequestException('User not found');
                if (!Number.isFinite(bet) || bet <= 0) {
                    throw new BadRequestException('Invalid bet');
                }
                if (Number(user.balance) < bet) {
                    throw new BadRequestException('Insufficient funds');
                }
                const updated = await tx.user.update({
                    where: { id: userId },
                    data: { balance: { decrement: bet } },
                });
                return { balance: Number(updated.balance), ...data };
            });

        const resolveRound = async (round: any, win: number, data: any) =>
            this.prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) throw new BadRequestException('User not found');
                if (win > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { balance: { increment: win } },
                    });
                }
                const updated = await tx.user.findUnique({ where: { id: userId } });
                await tx.game.create({
                    data: {
                        userId,
                        type: `arcade:${round.game}`,
                        bet: round.bet,
                        win,
                    },
                });
                this.arcadeRounds.delete(round.id);
                return { balance: Number(updated?.balance || 0), win, ...data };
            });

        if (['roulette', 'coinflip', 'dice', 'jackpot', 'plinko'].includes(game)) {
            if (game === 'roulette') {
                const choice = String(meta?.choice || 'red').toLowerCase();
                if (!['red', 'black', 'green'].includes(choice)) {
                    throw new BadRequestException('Invalid choice');
                }
                const landed = randomInt(0, 37);
                const color = this.rouletteColor(landed);
                const multiplier = choice === 'green' ? 14 : 2;
                const win = color === choice ? bet * multiplier : 0;
                return applySingleRound(win, { landed, color });
            }
            if (game === 'coinflip') {
                const choice = String(meta?.choice || 'heads').toLowerCase();
                if (!['heads', 'tails'].includes(choice)) {
                    throw new BadRequestException('Invalid choice');
                }
                const heads = this.randomFloat() > 0.5;
                const win = (heads && choice === 'heads') || (!heads && choice === 'tails') ? bet * 1.95 : 0;
                return applySingleRound(win, { heads });
            }
            if (game === 'dice') {
                const guess = String(meta?.guess || 'over').toLowerCase();
                const threshold = Number(meta?.threshold || 7);
                if (!['over', 'under'].includes(guess)) {
                    throw new BadRequestException('Invalid guess');
                }
                if (!Number.isFinite(threshold) || threshold < 3 || threshold > 11) {
                    throw new BadRequestException('Invalid threshold');
                }
                const d1 = randomInt(1, 7);
                const d2 = randomInt(1, 7);
                const sum = d1 + d2;
                const win =
                    (guess === 'over' && sum > threshold) || (guess === 'under' && sum < threshold)
                        ? bet * 1.8
                        : 0;
                return applySingleRound(win, { d1, d2, sum });
            }
            if (game === 'jackpot') {
                const pick = Number(meta?.pick);
                if (!Number.isInteger(pick) || pick < 0 || pick > 4) {
                    throw new BadRequestException('Invalid pick');
                }
                const jackpotIndex = randomInt(0, 5);
                const win = pick === jackpotIndex ? bet * 10 : 0;
                return applySingleRound(win, { jackpotIndex });
            }
            if (game === 'plinko') {
                const rows = Math.min(12, Math.max(8, Number(meta?.rows || 10)));
                const balls = Math.min(30, Math.max(1, Number(meta?.balls || 1)));
                const totalBet = bet * balls;
                if (!Number.isFinite(totalBet) || totalBet <= 0) {
                    throw new BadRequestException('Invalid bet');
                }
                const slotCount = rows + 1;
                const center = (slotCount - 1) / 2;
                const baseMultipliers = Array.from({ length: slotCount }, (_, idx) => {
                    const dist = Math.abs(idx - center) / center;
                    const value = Math.max(0.2, 6 * Math.pow(1 - dist, 2) + 0.2);
                    return Number(value.toFixed(2));
                });
                const weights = this.binomialWeights(slotCount);
                const expected = this.expectedMultiplier(baseMultipliers, weights);
                const targetReturn = 0.9;
                const payoutScale = expected > 0 ? targetReturn / expected : 0.9;
                const multipliers = baseMultipliers.map((value) =>
                    Number((value * payoutScale).toFixed(2))
                );
                const slots = Array.from({ length: balls }, () => this.pickWeighted(weights));
                const win = slots.reduce((sum, slot) => sum + bet * multipliers[slot], 0);
                return this.prisma.$transaction(async (tx) => {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (!user) throw new BadRequestException('User not found');
                    if (Number(user.balance) < totalBet) {
                        throw new BadRequestException('Insufficient funds');
                    }
                    const afterBetUser = await tx.user.update({
                        where: { id: userId },
                        data: { balance: { decrement: totalBet } },
                    });
                    const balanceAfterBet = Number(afterBetUser.balance);
                    if (win > 0) {
                        await tx.user.update({
                            where: { id: userId },
                            data: { balance: { increment: win } },
                        });
                    }
                    const updated = await tx.user.findUnique({ where: { id: userId } });
                    await tx.game.create({
                        data: {
                            userId,
                            type: `arcade:${game}`,
                            bet: totalBet,
                            win,
                        },
                    });
                    return {
                        balance: Number(updated?.balance || 0),
                        balanceAfterBet,
                        win,
                        rows,
                        slots,
                        multipliers,
                        totalBet,
                    };
                });
            }
        }

        if (game === 'mines') {
            if (action === 'start') {
                const bombs = new Set<number>();
                while (bombs.size < 5) {
                    bombs.add(randomInt(0, 25));
                }
                const id = this.nextRoundId();
                this.arcadeRounds.set(id, {
                    id,
                    userId,
                    game,
                    bet,
                    opened: 0,
                    bombs: Array.from(bombs),
                });
                const startData = await startRound({ roundId: id, bombs: Array.from(bombs) });
                return startData;
            }
            const round = this.arcadeRounds.get(roundId);
            if (!round || round.userId !== userId) {
                throw new BadRequestException('Round not found');
            }
            if (action === 'boom') {
                return resolveRound(round, 0, { opened: round.opened, hit: true });
            }
            if (action === 'cashout') {
                const opened = Number(meta?.opened || round.opened || 0);
                const multiplier = 1 + opened * 0.35;
                const win = round.bet * multiplier;
                return resolveRound(round, win, { opened, multiplier });
            }
            if (action === 'click') {
                const index = Number(meta?.index);
                if (!Number.isInteger(index) || index < 0 || index > 24) {
                    throw new BadRequestException('Invalid index');
                }
                if (round.bombs.includes(index)) {
                    return resolveRound(round, 0, { opened: round.opened, hit: true });
                }
                round.opened += 1;
                this.arcadeRounds.set(round.id, round);
                return { opened: round.opened, hit: false };
            }
        }

        if (game === 'crash') {
            if (action === 'start') {
                const crashAt = 0.9 + this.randomFloat() * 2.6;
                const id = this.nextRoundId();
                this.arcadeRounds.set(id, {
                    id,
                    userId,
                    game,
                    bet,
                    crashAt,
                });
                const startData = await startRound({ roundId: id, crashAt });
                return startData;
            }
            const round = this.arcadeRounds.get(roundId);
            if (!round || round.userId !== userId) {
                throw new BadRequestException('Round not found');
            }
            if (action === 'cashout') {
                const multiplier = Number(meta?.multiplier || 0);
                const win =
                    Number.isFinite(multiplier) && multiplier > 0 && multiplier <= round.crashAt
                        ? round.bet * multiplier * 0.6
                        : 0;
                return resolveRound(round, win, { crashAt: round.crashAt, multiplier });
            }
            if (action === 'boom') {
                return resolveRound(round, 0, { crashAt: round.crashAt });
            }
        }

        if (game === 'tower') {
            if (action === 'start') {
                const id = this.nextRoundId();
                this.arcadeRounds.set(id, {
                    id,
                    userId,
                    game,
                    bet,
                    level: 0,
                });
                const startData = await startRound({ roundId: id, level: 0 });
                return startData;
            }
            const round = this.arcadeRounds.get(roundId);
            if (!round || round.userId !== userId) {
                throw new BadRequestException('Round not found');
            }
            if (action === 'drop') {
                const level = Number(round.level || 0);
                const successChance = Math.max(0.2, 0.9 - level * 0.05);
                const ok = this.randomFloat() < successChance;
                if (!ok) {
                    return resolveRound(round, 0, { ok: false, overlap: 0.12, level });
                }
                round.level = level + 1;
                this.arcadeRounds.set(round.id, round);
                const overlap = 0.55 + this.randomFloat() * 0.35;
                return { ok: true, overlap, level: round.level };
            }
            if (action === 'cashout') {
                const level = Number(meta?.level || round.level || 0);
                const multiplier = 1 + level * 0.55;
                const win = round.bet * multiplier;
                return resolveRound(round, win, { level, multiplier });
            }
        }

        throw new BadRequestException('Unsupported arcade request');
    }
}
