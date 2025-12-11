import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';

import { GoogleDriveListFilesDto } from '../dto/google-drive-list-files.dto';

import { GoogleOAuthService } from './google-oauth.service';

@Injectable()
export class GoogleDriveService {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async getDriveClient(refreshToken: string): Promise<drive_v3.Drive> {
    const authClient =
      await this.googleOAuthService.getAuthenticatedClient(refreshToken);
    return google.drive({ version: 'v3', auth: authClient });
  }

  async listFiles(
    refreshToken: string,
    options: GoogleDriveListFilesDto,
  ): Promise<drive_v3.Schema$File[]> {
    const drive = await this.getDriveClient(refreshToken);
    const response = await drive.files.list(options);
    return response.data.files || [];
  }
}
