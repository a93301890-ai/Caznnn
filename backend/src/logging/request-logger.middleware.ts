import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from './logging.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    constructor(
        private loggingService: LoggingService,
        private jwtService: JwtService,
    ) { }

    async use(req: any, res: any, next: () => void) {
        res.on('finish', async () => {
            const token =
                (req.headers?.authorization && req.headers.authorization.split(' ')[1]) ||
                req.body?.token ||
                req.query?.token ||
                this.getCookieToken(req.headers?.cookie);
            const userId = token ? this.getUserId(token) : undefined;
            const sanitizedBody = this.sanitizeBody(req.body);
            await this.loggingService.logAction({
                action: `${req.method} ${req.originalUrl || req.url}`,
                userId,
                ip: req.ip,
                meta: {
                    status: res.statusCode,
                    body: sanitizedBody,
                    query: req.query,
                },
            });
        });
        next();
    }

    private getUserId(token: string) {
        try {
            const payload = this.jwtService.verify(token, { secret: 'supersecret' });
            return payload?.sub;
        } catch {
            return undefined;
        }
    }

    private getCookieToken(cookieHeader?: string) {
        if (!cookieHeader) return undefined;
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        const tokenCookie = cookies.find((c) => c.startsWith('token='));
        if (!tokenCookie) return undefined;
        return decodeURIComponent(tokenCookie.split('=')[1]);
    }

    private sanitizeBody(body?: Record<string, any>) {
        if (!body || typeof body !== 'object') return undefined;
        const copy = { ...body };
        ['password', 'pass', 'new_pass', 'old_pass'].forEach((key) => {
            if (key in copy) copy[key] = '[redacted]';
        });
        return copy;
    }
}
