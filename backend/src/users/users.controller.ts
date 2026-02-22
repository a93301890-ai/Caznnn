import {
    BadRequestException,
    Controller,
    Get,
    NotFoundException,
    Post,
    Patch,
    Body,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';

@Controller('user')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('history')
    async getHistory(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.getGameHistory(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Req() req: any) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        return {
            id: user.id,
            email: user.email,
            balance: user.balance,
            bonus: user.bonus,
            name: user.name,
            phone: user.phone,
            currency: user.currency,
            status: user.status,
            role: user.role,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(
        @Req() req: any,
        @Body('name') name?: string,
        @Body('phone') phone?: string,
        @Body('email') email?: string,
        @Body('currency') currency?: string,
    ) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        return this.usersService.updateProfile(userId, {
            name,
            phone,
            email,
            currency,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('get_balance')
    async getBalance(@Req() req: any) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        return {
            data: {
                balance: user.balance,
                curr_symbol: user.currency === 'USD' ? '$' : user.currency === 'EUR' ? '€' : '₽',
                bonus: user.bonus ?? 0,
            },
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('set_info')
    async setInfo(
        @Req() req: any,
        @Body('email') email?: string,
        @Body('name') name?: string,
        @Body('phone') phone?: string,
        @Body('old_pass') oldPass?: string,
        @Body('new_pass') newPass?: string,
    ) {
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        if (newPass) {
            if (!oldPass) throw new BadRequestException('Old password required');
            const match = await bcrypt.compare(oldPass, user.password);
            if (!match) throw new UnauthorizedException('Invalid credentials');
            const hashed = await bcrypt.hash(newPass, 10);
            await this.usersService.updatePassword(userId, hashed);
        }
        await this.usersService.updateProfile(userId, { email, name, phone });
        return { success: 'Updated' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('deposit')
    async deposit(
        @Req() req: any,
        @Body('amount') amount: string,
        @Body('payment') payment?: string,
        @Body('method') method?: string,
    ) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        const userId = req.user.sub;
        const user = await this.usersService.updateBalance(userId, value);
        await this.usersService.createTransaction(userId, {
            type: 'DEPOSIT',
            amount: value,
            metadata: { payment, method },
        });
        return { success: 'Deposit created', balance: user.balance };
    }

    @UseGuards(JwtAuthGuard)
    @Post('withdraw')
    async withdraw(
        @Req() req: any,
        @Body('amount') amount: string,
        @Body('method') method?: string,
        @Body('wallet') wallet?: string,
    ) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        const userId = req.user.sub;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        const current = Number(user.balance);
        if (current < value) throw new BadRequestException('Insufficient funds');
        await this.usersService.updateBalance(userId, -value);
        await this.usersService.createTransaction(userId, {
            type: 'WITHDRAW',
            amount: value,
            status: 'PENDING',
            metadata: { method, wallet },
        });
        return { success: 'Withdraw request created' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('transfer')
    async transfer(
        @Req() req: any,
        @Body('amount') amount: string,
        @Body('email') recipientEmail?: string,
    ) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        if (!recipientEmail) throw new BadRequestException('Recipient required');
        const userId = req.user.sub;
        const sender = await this.usersService.findById(userId);
        if (!sender) throw new NotFoundException('User not found');
        const recipient = await this.usersService.findByEmail(recipientEmail);
        if (!recipient) throw new NotFoundException('Recipient not found');
        if (Number(sender.balance) < value) {
            throw new BadRequestException('Insufficient funds');
        }
        await this.usersService.updateBalance(userId, -value);
        await this.usersService.updateBalance(recipient.id, value);
        await this.usersService.createTransaction(userId, {
            type: 'TRANSFER',
            amount: value,
            metadata: { to: recipient.email },
        });
        await this.usersService.createTransaction(recipient.id, {
            type: 'TRANSFER',
            amount: value,
            metadata: { from: sender.email },
        });
        return { success: 'Transfer completed' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('voucher')
    async voucher(@Req() req: any, @Body('voucher') voucher?: string) {
        if (!voucher) throw new BadRequestException('Voucher required');
        const bonus = 100;
        const userId = req.user.sub;
        await this.usersService.updateBalance(userId, bonus);
        await this.usersService.createTransaction(userId, {
            type: 'BONUS',
            amount: bonus,
            metadata: { voucher },
        });
        return { success: 'Voucher activated', amount: bonus };
    }

    @UseGuards(JwtAuthGuard)
    @Get('transactions')
    async transactions(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.listTransactions(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('bets')
    async bets(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.listBets(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('kyc/request')
    async requestKyc(@Req() req: any, @Body('notes') notes?: string) {
        const userId = req.user.sub;
        return this.usersService.createKycRequest(userId, notes);
    }

    @UseGuards(JwtAuthGuard)
    @Get('kyc')
    async kyc(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.listKycRequests(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('support/message')
    async supportMessage(@Req() req: any, @Body('message') message?: string) {
        const userId = req.user.sub;
        if (!message) throw new BadRequestException('Message required');
        return this.usersService.createSupportMessage(userId, 'USER', message);
    }

    @UseGuards(JwtAuthGuard)
    @Get('support')
    async supportThread(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.listSupportMessages(userId);
    }

}
