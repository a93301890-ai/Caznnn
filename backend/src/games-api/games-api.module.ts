import { Module } from '@nestjs/common';
import { GamesApiService } from './games-api.service';
import { GamesApiController } from './games-api.controller';
import { GamesApiCallbackService } from './games-api.callback.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [AuthModule, UsersModule],
    providers: [GamesApiService, GamesApiCallbackService, PrismaService],
    controllers: [GamesApiController],
    exports: [GamesApiService],
})
export class GamesApiModule { }
