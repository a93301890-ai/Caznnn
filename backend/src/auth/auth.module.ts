import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LegacyUserAuthController } from './legacy-user.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.strategy';

@Module({
    imports: [
        forwardRef(() => UsersModule),
        JwtModule.register({
            secret: 'supersecret', // � prod: ������� � .env
            signOptions: { expiresIn: '15m' },
        }),
    ],
    providers: [AuthService, JwtAuthGuard],
    controllers: [AuthController, LegacyUserAuthController],
    exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule { }
