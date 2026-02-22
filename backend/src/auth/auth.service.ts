import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (user.status === 'BANNED') {
            throw new UnauthorizedException('User blocked');
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new UnauthorizedException('Invalid credentials');
        return user;
    }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        // ��������� refresh token � ���� (�����������, ��� ������� ������)
        await this.usersService.updateRefreshToken(user.id, refreshToken);
        return { accessToken, refreshToken };
    }

    async register(
        email: string,
        password: string,
        profile?: { name?: string; phone?: string; currency?: string },
    ) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) throw new UnauthorizedException('Email already exists');
        const user = await this.usersService.createUser(email, password, profile);
        return this.login(user);
    }

    async refreshToken(userId: number, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || user.refreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        return this.login(user);
    }

    async requestPasswordReset(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { ok: true };
        }
        const token = randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
        await this.usersService.createPasswordReset(user.id, token, expiresAt);
        return { ok: true, token };
    }

    async resetPassword(token: string, newPassword: string) {
        const reset = await this.usersService.findPasswordReset(token);
        if (!reset || reset.used || reset.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid reset token');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(reset.userId, hashed);
        await this.usersService.markPasswordResetUsed(reset.id);
        return { ok: true };
    }
}
