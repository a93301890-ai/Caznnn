import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('user')
export class LegacyUserAuthController {
    constructor(private authService: AuthService) { }

    @Post('auth')
    async auth(
        @Body('email') email: string,
        @Body('pass') password: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.authService.validateUser(email, password);
        const tokens = await this.authService.login(user);
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { token: tokens.accessToken };
    }

    @Post('reg')
    async reg(
        @Body('email') email: string,
        @Body('pass') password: string,
        @Res({ passthrough: true }) res: Response,
        @Body('name') name?: string,
        @Body('phone') phone?: string,
        @Body('curr') currency?: string,
    ) {
        const normalizedCurrency = currency && currency !== '0' ? currency : undefined;
        const tokens = await this.authService.register(email, password, {
            name,
            phone,
            currency: normalizedCurrency,
        });
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { token: tokens.accessToken };
    }

    @Post('forgot')
    async forgot(@Body('email') email: string) {
        const result = await this.authService.requestPasswordReset(email);
        return {
            success: 'Инструкция отправлена на email',
            token: result.token,
        };
    }
}
