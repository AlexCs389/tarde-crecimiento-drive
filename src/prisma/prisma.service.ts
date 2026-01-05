import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = prisma;

  get user() {
    return this.client.user;
  }

  get $transaction() {
    return this.client.$transaction.bind(
      this.client,
    ) as typeof this.client.$transaction;
  }

  get $queryRaw() {
    return this.client.$queryRaw.bind(
      this.client,
    ) as typeof this.client.$queryRaw;
  }

  get $executeRaw() {
    return this.client.$executeRaw.bind(
      this.client,
    ) as typeof this.client.$executeRaw;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
