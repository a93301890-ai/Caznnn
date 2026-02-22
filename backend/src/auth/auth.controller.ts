import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) res: Response,
        @Body('name') name?: string,
        @Body('phone') phone?: string,
        @Body('currency') currency?: string,
    ) {
        const tokens = await this.authService.register(email, password, {
            name,
            phone,
            currency,
        });
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: false, // true � prod
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { accessToken: tokens.accessToken };
    }

    @Post('login')
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const tokens = await this.authService.login(await this.authService.validateUser(email, password));
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: false, // true � prod
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { accessToken: tokens.accessToken };
    }

    @Post('refresh')
    async refresh(
        @Body('userId') userId: number,
        @Body('refreshToken') refreshToken: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const tokens = await this.authService.refreshToken(userId, refreshToken);
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { accessToken: tokens.accessToken };
    }

    @Post('forgot')
    async forgot(@Body('email') email: string) {
        return this.authService.requestPasswordReset(email);
    }

    @Post('reset')
    async reset(
        @Body('token') token: string,
        @Body('password') password: string,
    ) {
        return this.authService.resetPassword(token, password);
    }
}

