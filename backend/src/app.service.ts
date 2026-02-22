import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin12345!';
    const existing = await this.prisma.user.findUnique({ where: { email } });
    const hashed = await bcrypt.hash(password, 10);
    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', password: hashed },
      });
      return;
    }
    await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name: 'Admin',
        role: 'ADMIN',
      },
    });
  }
}
