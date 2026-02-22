import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [BetsService, PrismaService],
    controllers: [BetsController],
    exports: [BetsService],
})
export class BetsModule { }
