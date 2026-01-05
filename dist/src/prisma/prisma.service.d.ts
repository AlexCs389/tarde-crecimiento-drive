import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    readonly client: import("../../generated/prisma/internal/class").PrismaClient<never, import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined, import("@prisma/client/runtime/client").DefaultArgs>;
    get user(): import("../../generated/prisma/models").UserDelegate<import("@prisma/client/runtime/client").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get $transaction(): typeof this.client.$transaction;
    get $queryRaw(): typeof this.client.$queryRaw;
    get $executeRaw(): typeof this.client.$executeRaw;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
