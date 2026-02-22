import { Controller, Get, Query, Sse, Body, Post, UseGuards } from '@nestjs/common';
import { interval, map, switchMap } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { SportsService } from './sports.service';
import { BookiesApiService } from './bookies-api.service';

@Controller('sports')
export class SportsController {
    constructor(
        private sportsService: SportsService,
        private bookiesApi: BookiesApiService,
    ) { }

    /* ───── BookiesAPI proxy endpoints ───── */

    @Get('live')
    async liveEvents() {
        return this.bookiesApi.getLiveEvents();
    }

    @Get('live/odds')
    async liveOdds(
        @Query('game_id') gameId: string,
        @Query('bookmaker') bookmaker?: string,
    ) {
        return this.bookiesApi.getLiveOdds(gameId, bookmaker || 'bet365');
    }

    @Get('prematch')
    async prematchEvents(
        @Query('sport') sport: string,
        @Query('bookmaker') bookmaker?: string,
    ) {
        return this.bookiesApi.getPrematchEvents(sport || 'soccer', bookmaker || 'bet365');
    }

    @Get('prematch/odds')
    async prematchOdds(
        @Query('game_id') gameId: string,
        @Query('bookmaker') bookmaker?: string,
    ) {
        return this.bookiesApi.getPrematchOdds(gameId, bookmaker || 'bet365');
    }

    @Get('result')
    async gameResult(
        @Query('game_id') gameId: string,
        @Query('bookmaker') bookmaker?: string,
    ) {
        return this.bookiesApi.getResult(gameId, bookmaker || 'bet365');
    }

    /* ───── Original DB‑based endpoints ───── */

    @Get('events')
    async events(
        @Query('status') status?: string,
        @Query('sport') sport?: string,
        @Query('live') live?: string,
    ) {
        return this.sportsService.listEvents({
            status,
            sport,
            live: live === 'true' ? true : live === 'false' ? false : undefined,
        });
    }

    @Sse('live/stream')
    liveStream() {
        return interval(5000).pipe(
            switchMap(() => this.sportsService.listEvents({ live: true })),
            map((events) => ({ data: events })),
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('events')
    async createEvent(@Body() body: any) {
        return this.sportsService.createEvent({
            sport: body.sport,
            league: body.league,
            name: body.name,
            startTime: new Date(body.startTime),
            markets: body.markets,
        });
    }
}
