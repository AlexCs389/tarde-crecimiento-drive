import { Injectable } from '@nestjs/common';
import { google, Auth } from 'googleapis';

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: Auth.OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async getAuthenticatedClient(
    refreshToken: string,
  ): Promise<Auth.OAuth2Client> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    await this.oauth2Client.getAccessToken();
    return this.oauth2Client;
  }
}
