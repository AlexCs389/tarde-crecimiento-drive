import { drive_v3 } from 'googleapis';
import { GoogleDriveListFilesDto } from '../dto/google-drive-list-files.dto';
import { GoogleOAuthService } from './google-oauth.service';
export declare class GoogleDriveService {
    private readonly googleOAuthService;
    constructor(googleOAuthService: GoogleOAuthService);
    getDriveClient(refreshToken: string): Promise<drive_v3.Drive>;
    listFiles(refreshToken: string, options: GoogleDriveListFilesDto): Promise<drive_v3.Schema$File[]>;
}
