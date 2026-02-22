import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { BetsService } from './bets.service';

@Controller('bets')
export class BetsController {
    constructor(private betsService: BetsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async place(@Req() req: any, @Body() body: any) {
        return this.betsService.placeBet({
            userId: req.user.sub,
            type: body.type ?? 'SINGLE',
            stake: Number(body.stake),
            selections: body.selections ?? [],
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async list(@Req() req: any, @Query('status') status?: string) {
        return this.betsService.listUserBets(req.user.sub, status);
    }
}
