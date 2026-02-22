import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { BetsModule } from '../bets/bets.module';
import { SportsModule } from '../sports/sports.module';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, UsersModule, BetsModule, SportsModule],
    controllers: [AdminController],
    providers: [PrismaService],
})
export class AdminModule { }
