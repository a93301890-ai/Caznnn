import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggingModule } from './logging/logging.module';
import { RequestLoggerMiddleware } from './logging/request-logger.middleware';
import { JwtModule } from '@nestjs/jwt';
import { SportsModule } from './sports/sports.module';
import { BetsModule } from './bets/bets.module';
import { CasinoModule } from './casino/casino.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './prisma.service';
import { GamesApiModule } from './games-api/games-api.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    LoggingModule,
    SportsModule,
    BetsModule,
    CasinoModule,
    AdminModule,
    GamesApiModule,
    JwtModule.register({
      secret: 'supersecret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
