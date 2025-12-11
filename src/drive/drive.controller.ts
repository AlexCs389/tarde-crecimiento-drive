import { Controller, Get, Query } from '@nestjs/common';

import { DriveService } from './drive.service';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('files')
  async files(@Query('refresh_token') refreshToken: string) {
    const files = await this.driveService.listFiles(refreshToken);
    return { files };
  }
}
