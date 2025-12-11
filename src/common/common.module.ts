import { Module } from '@nestjs/common';

import { GoogleDriveService } from './services/google-drive.service';
import { GoogleOAuthService } from './services/google-oauth.service';

@Module({
  providers: [GoogleOAuthService, GoogleDriveService],
  exports: [GoogleOAuthService, GoogleDriveService],
})
export class CommonModule {}
