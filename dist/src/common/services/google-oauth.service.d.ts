import { Auth } from 'googleapis';
export declare class GoogleOAuthService {
    private oauth2Client;
    constructor();
    getAuthenticatedClient(refreshToken: string): Promise<Auth.OAuth2Client>;
}
