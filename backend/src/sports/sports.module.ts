import { Module } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { BookiesApiService } from './bookies-api.service';

@Module({
    imports: [AuthModule],
    providers: [SportsService, PrismaService, BookiesApiService],
    controllers: [SportsController],
    exports: [SportsService, BookiesApiService],
})
export class SportsModule { }
