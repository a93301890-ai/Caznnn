import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { UsersService } from '../users/users.service';
import { BetsService } from '../bets/bets.service';
import { SportsService } from '../sports/sports.service';
import { PrismaService } from '../prisma.service';

@Controller('admin')
export class AdminController {
    constructor(
        private usersService: UsersService,
        private betsService: BetsService,
        private sportsService: SportsService,
        private prisma: PrismaService,
    ) { }

    private async assertAdmin(userId: number) {
        const user = await this.usersService.findById(userId);
        if (!user || user.role !== 'ADMIN') {
            throw new UnauthorizedException('Admin access required');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('users')
    async users(@Req() req: any) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                balance: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('users/:id/status')
    async updateUserStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.user.update({
            where: { id: Number(id) },
            data: { status: status as any },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('users/:id')
    async updateUser(
        @Req() req: any,
        @Param('id') id: string,
        @Body('email') email?: string,
        @Body('role') role?: string,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.user.update({
            where: { id: Number(id) },
            data: {
                email: email ?? undefined,
                role: role as any,
            },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('users/:id/balance')
    async adjustBalance(
        @Req() req: any,
        @Param('id') id: string,
        @Body('amount') amount: number,
        @Body('reason') reason?: string,
    ) {
        await this.assertAdmin(req.user.sub);
        const value = Number(amount);
        if (!Number.isFinite(value) || value === 0) {
            throw new BadRequestException('Invalid amount');
        }
        const userId = Number(id);
        await this.usersService.updateBalance(userId, value);
        await this.usersService.createTransaction(userId, {
            type: 'ADJUSTMENT',
            amount: value,
            metadata: { reason, by: req.user.sub },
        });
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('bets')
    async bets(@Req() req: any, @Query('status') status?: string) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.bet.findMany({
            where: { status: status as any },
            include: { selections: true, user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('transactions')
    async transactions(@Req() req: any, @Query('type') type?: string) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.transaction.findMany({
            where: { type: type as any },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('transactions/:id/status')
    async updateTransactionStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.transaction.update({
            where: { id: Number(id) },
            data: { status: status as any },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('kyc')
    async kyc(@Req() req: any) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.kycRequest.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('kyc/:id/status')
    async updateKycStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('notes') notes?: string,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.kycRequest.update({
            where: { id: Number(id) },
            data: { status: status as any, notes: notes ?? undefined },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('support')
    async support(@Req() req: any) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.supportMessage.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('support/reply')
    async supportReply(
        @Req() req: any,
        @Body('userId') userId: number,
        @Body('message') message: string,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.supportMessage.create({
            data: {
                userId,
                from: 'ADMIN',
                message,
            },
        });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('bets/:id/status')
    async settleBet(
        @Req() req: any,
        @Param('id') id: string,
        @Body('status') status: 'WON' | 'LOST' | 'VOID',
    ) {
        await this.assertAdmin(req.user.sub);
        return this.betsService.settleBet(Number(id), status);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('events/:id')
    async updateEvent(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: any,
    ) {
        await this.assertAdmin(req.user.sub);
        return this.sportsService.updateEvent(Number(id), {
            league: body.league,
            name: body.name,
            startTime: body.startTime ? new Date(body.startTime) : undefined,
            status: body.status,
            isLive: body.isLive,
            score: body.score,
            markets: body.markets,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('logs')
    async logs(@Req() req: any, @Query('userId') userId?: string) {
        await this.assertAdmin(req.user.sub);
        return this.prisma.actionLog.findMany({
            where: userId ? { userId: Number(userId) } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
}
