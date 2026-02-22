import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { UsersService } from '../users/users.service';
import { GamesApiService } from './games-api.service';
import { GamesApiCallbackService } from './games-api.callback.service';

@Controller('games-api')
export class GamesApiController {
    constructor(
        private gamesApiService: GamesApiService,
        private gamesApiCallback: GamesApiCallbackService,
        private usersService: UsersService,
    ) { }

    private async assertAdmin(userId: number) {
        const user = await this.usersService.findById(userId);
        if (!user || user.role !== 'ADMIN') {
            throw new UnauthorizedException('Admin access required');
        }
    }

    @Post('callback')
    async callback(@Body() body: any) {
        return this.gamesApiCallback.handle(body ?? {});
    }

    @Get('status')
    async status() {
        const baseUrl = process.env.GAMES_API_BASE_URL || '';
        const hallId = process.env.GAMES_API_HALL_ID || '';
        const hallKey = process.env.GAMES_API_HALL_KEY || '';
        const missing: string[] = [];
        if (!baseUrl) missing.push('GAMES_API_BASE_URL');
        if (!hallId) missing.push('GAMES_API_HALL_ID');
        if (!hallKey) missing.push('GAMES_API_HALL_KEY');

        const api = { ok: false, error: null as string | null };
        if (!missing.length) {
            try {
                const response = await this.gamesApiService.getGamesList();
                api.ok = response?.status === 'success';
                api.error = api.ok ? null : (response?.error || 'request_failed');
            } catch (error: any) {
                api.ok = false;
                api.error = error?.message || 'request_failed';
            }
        }

        return {
            configured: missing.length === 0,
            missing,
            api,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('jackpots')
    async jackpots(@Req() req: any) {
        await this.assertAdmin(req.user.sub);
        return this.gamesApiService.jackpots();
    }

    @UseGuards(JwtAuthGuard)
    @Post('sessions/log')
    async sessionsLog(@Req() req: any, @Body() body: any) {
        await this.assertAdmin(req.user.sub);
        const sessionsId = String(body.sessionsId || body.sessionId || '').trim();
        if (!sessionsId) throw new BadRequestException('sessionsId required');
        const count = body.count ? Number(body.count) : undefined;
        const page = body.page ? Number(body.page) : undefined;
        return this.gamesApiService.gameSessionsLog({ sessionsId, count, page });
    }

    @UseGuards(JwtAuthGuard)
    @Post('hall')
    async createHall(@Req() req: any, @Body() body: any) {
        await this.assertAdmin(req.user.sub);
        if (!body?.apiKey || !body?.agent || !body?.key || !body?.host || !body?.login || !body?.currency) {
            throw new BadRequestException('apiKey, agent, key, host, login, currency required');
        }
        return this.gamesApiService.createHall({
            apiKey: body.apiKey,
            agent: body.agent,
            key: body.key,
            host: body.host,
            hall: body.hall,
            login: body.login,
            currency: body.currency,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('hall/config')
    async changeHallConfig(@Req() req: any, @Body() body: any) {
        await this.assertAdmin(req.user.sub);
        if (!body?.hall || !body?.key) {
            throw new BadRequestException('hall and key required');
        }
        return this.gamesApiService.changeHallConfig({
            hall: body.hall,
            key: body.key,
            data: body.data,
        });
    }
}
