import { Module } from '@nestjs/common';

import { DriveModule } from './drive/drive.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [PrismaModule, AuthenticationModule, DriveModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
