import { Module } from '@nestjs/common';

import { DriveModule } from './drive/drive.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, DriveModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
