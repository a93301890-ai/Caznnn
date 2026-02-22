import { Module } from '@nestjs/common';
import { CasinoService } from './casino.service';
import { CasinoController } from './casino.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GamesApiModule } from '../games-api/games-api.module';

@Module({
    imports: [AuthModule, GamesApiModule],
    providers: [CasinoService, PrismaService],
    controllers: [CasinoController],
})
export class CasinoModule { }
