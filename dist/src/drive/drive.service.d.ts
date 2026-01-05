import { GoogleDriveService } from '../common/services/google-drive.service';
export declare class DriveService {
    private readonly googleDriveService;
    constructor(googleDriveService: GoogleDriveService);
    listFiles(refreshToken: string): Promise<import("googleapis").drive_v3.Schema$File[]>;
}
