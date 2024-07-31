import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Session,
  UseGuards,
  Query,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from './modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateUserDto,
  SendEmailDto,
} from './modules/user/dto/create-user.dto';
import { LocalAuthGuard } from 'src/modules/auth/auth.guard';

import { OAuth2Strategy } from './modules/auth/oauth.strategy';

import { Response } from 'express';
import * as svgCaptcha from 'svg-captcha';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly oauth2Strategy: OAuth2Strategy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 获取验证码图片
  @Get('auth/captcha')
  @ApiOperation({ summary: '获取验证码图片', description: '获取验证码图片' })
  createCode(@Res() res: Response, @Session() session: any) {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      background: '#ffffff',
      fontSize: 18,
      width: 100,
      height: 30,
    });

    res.contentType('image/svg+xml');
    session.code = captcha.text;
    console.log('captcha', captcha.text);
    res.send(captcha.data);
  }

  // 登录
  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: '登录', description: '登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  // 注册
  @Post('auth/register')
  @ApiOperation({ summary: '注册用户', description: '注册用户' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: '注册成功' })
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  // 发送注册邮箱验证码
  @Post('auth/emailCode')
  @ApiOperation({
    summary: '发送注册邮箱验证码',
    description: '发送注册邮箱验证码',
  })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendEmailCode(@Body() body: SendEmailDto) {
    await this.userService.sendEmailCode(body.email);
    return '邮件发送中，请注意查收';
  }

  // LinuxDo OAuth2 登录
  @Get('auth/oauth2')
  @ApiOperation({
    summary: 'LinuxDo OAuth2 登录',
    description: 'LinuxDo OAuth2 登录',
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  async oauth2(@Res() res: Response, @Session() session: any) {
    console.log('oauth2');
    // 随机生成一个state并存储到session中
    session.state = this.oauth2Strategy.generateState();
    const authorizationURL = this.oauth2Strategy.getAuthorizationURL(
      session.state,
    );

    // 重定向
    res.redirect(authorizationURL);
  }

  // LinuxDo OAuth2 回调地址
  @Get('/oauth2/callback')
  @ApiOperation({
    summary: 'LinuxDo OAuth2 回调地址',
    description: 'LinuxDo OAuth2 回调地址',
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  async oauth2Callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: any,
  ) {
    if (state !== session.state) {
      throw new Error('状态码错误，谨防跨站请求伪造攻击！');
    }

    console.log('oauth2Callback');
    try {
      const accessToken = await this.oauth2Strategy.exchangeCodeForToken(code);
      const userInfo = await this.oauth2Strategy.getUserInfo(accessToken);

      // 根据需要处理用户信息
      console.log('userInfo', userInfo);
      // find or create user
      const res = await this.userService.findOrCreate({
        id: userInfo.id,
        username: userInfo.username,
        nickname: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar_url,
        trustLevel: userInfo.trust_level,
      });
      if (!res) {
        throw new InternalServerErrorException('用户信息获取失败');
      }

      // 成功认证后生成token
      const { access_token } = this.authService.login(userInfo);
      (res as any).access_token = access_token;
      return res;
    } catch (error) {
      // 处理错误
      console.error(error);
      return new UnauthorizedException('OAuth2登录失败');
    }
  }
}
