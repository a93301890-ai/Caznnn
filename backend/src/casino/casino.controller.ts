import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CasinoService } from './casino.service';
import type { Response } from 'express';
import { GamesApiService } from '../games-api/games-api.service';

@Controller('casino')
export class CasinoController {
    constructor(
        private casinoService: CasinoService,
        private gamesApiService: GamesApiService,
    ) { }

    @Get('slots')
    async listSlots(@Query('img') img?: string, @Query('cdnUrl') cdnUrl?: string) {
        try {
            const response = await this.gamesApiService.getGamesList({ img, cdnUrl });
            const slots = this.mapGamesList(response);
            return slots.filter((slot) => {
                if (slot?.remote !== true) return false;
                const demo = slot?.demo;
                return demo === true || demo === 1 || String(demo || '').trim() === '1';
            });
        } catch {
            return [];
        }
    }

    @Get('slots/placeholder')
    slotPlaceholder(@Query('title') title: string, @Res() res: Response) {
        const safe = (title || 'Slot')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a0d0b"/>
      <stop offset="100%" stop-color="#0f1016"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ff9a3c" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ff5a3d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#glow)"/>
  <rect x="20" y="20" width="600" height="320" rx="24" fill="none" stroke="#ff7a45" stroke-opacity="0.35" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#ffe2c2" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">
    ${safe}
  </text>
</svg>`;
        res.type('image/svg+xml').send(svg);
    }

    @UseGuards(JwtAuthGuard)
    @Post('spin')
    spin(@Req() req: any, @Body('slotId') slotId: string, @Body('bet') bet: string) {
        return this.casinoService.spin(req.user.sub, slotId, Number(bet));
    }

    @UseGuards(JwtAuthGuard)
    @Post('open')
    async openGame(@Req() req: any, @Body() body: any) {
        const gameId = String(body?.gameId || '').trim();
        if (!gameId) throw new BadRequestException('gameId required');
        const rawLogin = String(req.user?.email ?? req.user?.sub ?? '').trim();
        const safeLogin = rawLogin && rawLogin.length >= 2 && !/[\s:;#]/.test(rawLogin)
            ? rawLogin
            : String(req.user?.sub ?? '').trim();
        if (!safeLogin) throw new BadRequestException('login required');

        const origin = String(body?.domain || req.headers?.origin || '').trim();
        const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').trim();
        const proto = String(req.headers?.['x-forwarded-proto'] || req.protocol || 'http').trim();
        const domain = origin || (host ? `${proto}://${host}` : '');
        if (!domain) throw new BadRequestException('domain required');

        const exitUrl = String(body?.exitUrl || `${domain}/casino`).trim();
        try {
            const response = await this.gamesApiService.openGame({
                login: safeLogin,
                gameId,
                domain,
                exitUrl,
                language: body?.language,
                demo: body?.demo,
                bm: body?.bm,
                cdnUrl: body?.cdnUrl,
            });
            if (response?.status && response.status !== 'success') {
                return { status: 'fail', error: response?.error || 'openGame failed' };
            }
            return response;
        } catch (error: any) {
            return { status: 'fail', error: error?.message || 'openGame failed' };
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('arcade/bet')
    arcadeBet(@Req() req: any, @Body('game') game: string, @Body('bet') bet: string) {
        return this.casinoService.arcadeBet(req.user.sub, game, Number(bet));
    }

    @UseGuards(JwtAuthGuard)
    @Post('arcade/payout')
    arcadePayout(@Req() req: any, @Body('game') game: string, @Body('amount') amount: string) {
        return this.casinoService.arcadePayout(req.user.sub, game, Number(amount));
    }

    @UseGuards(JwtAuthGuard)
    @Post('arcade/round')
    arcadeRound(@Req() req: any, @Body() body: any) {
        return this.casinoService.arcadeRound(req.user.sub, body);
    }

    private mapGamesList(response: any) {
        const content = response?.content;
        if (!content || typeof content !== 'object') return [];
        const slots: any[] = [];
        for (const [providerKey, games] of Object.entries(content)) {
            if (!Array.isArray(games)) continue;
            games.forEach((game: any) => {
                const id = String(game?.id ?? '').trim();
                const name = String(game?.name ?? '').trim();
                if (!id || !name) return;
                slots.push({
                    id,
                    name,
                    provider: String(game?.title || providerKey || ''),
                    category: String(game?.categories || ''),
                    image: game?.img,
                    device: game?.device,
                    demo: game?.demo,
                    bm: game?.bm,
                    rewriterule: game?.rewriterule,
                    exitButton: game?.exitButton,
                    remote: true,
                });
            });
        }
        return slots;
    }
}
