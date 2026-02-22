import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createUser(
        email: string,
        password: string,
        profile?: { name?: string; phone?: string; currency?: string },
    ) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: profile?.name,
                phone: profile?.phone,
                currency: profile?.currency ?? undefined,
            },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async updateRefreshToken(userId: number, refreshToken: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken },
        });
    }

    async updateProfile(
        userId: number,
        data: { name?: string; phone?: string; email?: string; currency?: string },
    ) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }

    async updatePassword(userId: number, hashedPassword: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }

    async updateBalance(userId: number, delta: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: delta } },
        });
    }

    async setBalance(userId: number, value: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { balance: value },
        });
    }

    async createTransaction(userId: number, data: { type: string; amount: number; status?: string; metadata?: any }) {
        return this.prisma.transaction.create({
            data: {
                userId,
                type: data.type as any,
                amount: data.amount,
                status: (data.status as any) ?? 'COMPLETED',
                metadata: data.metadata ?? undefined,
            },
        });
    }

    async listTransactions(userId: number) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listBets(userId: number, status?: string) {
        return this.prisma.bet.findMany({
            where: { userId, status: status as any },
            include: { selections: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createKycRequest(userId: number, notes?: string) {
        return this.prisma.kycRequest.create({
            data: {
                userId,
                notes: notes ?? undefined,
            },
        });
    }

    async listKycRequests(userId: number) {
        return this.prisma.kycRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createSupportMessage(userId: number, from: 'USER' | 'ADMIN', message: string) {
        return this.prisma.supportMessage.create({
            data: {
                userId,
                from,
                message,
            },
        });
    }

    async listSupportMessages(userId: number) {
        return this.prisma.supportMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createPasswordReset(userId: number, token: string, expiresAt: Date) {
        return this.prisma.passwordReset.create({
            data: { userId, token, expiresAt },
        });
    }

    async findPasswordReset(token: string) {
        return this.prisma.passwordReset.findUnique({ where: { token } });
    }

    async markPasswordResetUsed(id: number) {
        return this.prisma.passwordReset.update({
            where: { id },
            data: { used: true },
        });
    }

    async getGameHistory(userId: number) {
        return this.prisma.game.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
