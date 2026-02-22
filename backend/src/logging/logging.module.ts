import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [LoggingService, PrismaService],
    exports: [LoggingService],
})
export class LoggingModule { }
