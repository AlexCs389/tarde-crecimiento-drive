import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';

import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';

@Module({
  imports: [CommonModule],
  controllers: [DriveController],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}
