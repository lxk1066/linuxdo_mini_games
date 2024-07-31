import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuth2Strategy {
  private readonly authorizationURL: string;
  private readonly tokenURL: string;
  private readonly clientID: string;
  private readonly clientSecret: string;
  private readonly callbackURL: string;
  private readonly userUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authorizationURL = this.configService.get('OAUTH_AUTHORIZATION_URL');
    this.tokenURL = this.configService.get('OAUTH_TOKEN_URL');
    this.clientID = this.configService.get('OAUTH_CLIENT_ID');
    this.clientSecret = this.configService.get('OAUTH_CLIENT_SECRET');
    this.callbackURL = this.configService.get('OAUTH_CALLBACK_URL');
    this.userUrl = this.configService.get('OAUTH_USER_INFO_URL');
  }

  // 获取授权 URL
  getAuthorizationURL(state?: string): string {
    const params = new URLSearchParams([
      ['client_id', this.clientID],
      ['response_type', 'code'],
      ['redirect_uri', this.callbackURL],
      ['state', state || ''],
    ]);

    return `${this.authorizationURL}?${params.toString()}`;
  }

  // 生成随机state, 用于防止攻击
  generateState(): string {
    return Math.random().toString(36).substring(2);
  }

  // 交换授权码为访问令牌
  async exchangeCodeForToken(code: string): Promise<string> {
    const authHeader = Buffer.from(
      `${this.clientID}:${this.clientSecret}`,
    ).toString('base64');
    const data = new URLSearchParams([
      ['grant_type', 'authorization_code'],
      ['code', code],
      ['redirect_uri', this.callbackURL],
    ]);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    };

    const response = await axios.post(this.tokenURL, data, { headers });

    if (response.status !== 200) {
      throw new Error('Failed to exchange code for token');
    }

    return response.data.access_token;
  }

  // 获取用户信息
  async getUserInfo(accessToken: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await axios.get(this.userUrl, { headers });

    if (response.status !== 200) {
      throw new Error('Failed to fetch user info');
    }

    return response.data;
  }
}
