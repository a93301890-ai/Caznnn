import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LoggingService {
    constructor(private prisma: PrismaService) { }

    async logAction(params: {
        action: string;
        userId?: number;
        meta?: Record<string, any>;
        ip?: string;
    }) {
        return this.prisma.actionLog.create({
            data: {
                action: params.action,
                userId: params.userId,
                meta: params.meta ?? undefined,
                ip: params.ip,
            },
        });
    }
}
