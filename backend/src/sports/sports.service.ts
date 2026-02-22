import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SportsService {
    constructor(private prisma: PrismaService) { }

    listEvents(filters: { status?: string; sport?: string; live?: boolean }) {
        return this.prisma.sportEvent.findMany({
            where: {
                status: filters.status as any,
                sport: filters.sport,
                isLive: filters.live,
            },
            orderBy: { startTime: 'asc' },
        });
    }

    createEvent(data: {
        sport: string;
        league: string;
        name: string;
        startTime: Date;
        markets?: any;
    }) {
        return this.prisma.sportEvent.create({ data });
    }

    updateEvent(
        id: number,
        data: {
            league?: string;
            name?: string;
            startTime?: Date;
            status?: string;
            isLive?: boolean;
            score?: string;
            markets?: any;
        },
    ) {
        return this.prisma.sportEvent.update({
            where: { id },
            data: {
                league: data.league,
                name: data.name,
                startTime: data.startTime,
                status: data.status as any,
                isLive: data.isLive,
                score: data.score,
                markets: data.markets,
            },
        });
    }
}
