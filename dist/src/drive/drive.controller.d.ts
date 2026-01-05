import { DriveService } from './drive.service';
export declare class DriveController {
    private readonly driveService;
    constructor(driveService: DriveService);
    files(refreshToken: string): Promise<{
        files: import("googleapis").drive_v3.Schema$File[];
    }>;
}
