import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        const token =
            (authHeader && authHeader.split(' ')[1]) ||
            request.body?.token ||
            request.query?.token ||
            this.getCookieToken(request.headers?.cookie);
        if (!token) return false;
        try {
            const payload = this.jwtService.verify(token, { secret: 'supersecret' });
            request.user = payload;
            return true;
        } catch {
            return false;
        }
    }

    private getCookieToken(cookieHeader?: string) {
        if (!cookieHeader) return undefined;
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        const tokenCookie = cookies.find((c) => c.startsWith('token='));
        if (!tokenCookie) return undefined;
        return decodeURIComponent(tokenCookie.split('=')[1]);
    }
}
