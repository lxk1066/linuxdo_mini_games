import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
      session: true,
    });
  }

  // 用于验证本地策略（不需要验证JWT）
  // 对于本地(local)策略，validate方法会接收到请求体中的用户名和密码并作为参数传递进来
  async validate(req: any, username: string, password: string): Promise<any> {
    // 校验session中的验证码，通过调用/user/code接口获取
    const session = req.session;
    const validateCode = req.body?.code;
    if (!session.code || !validateCode) {
      throw new UnauthorizedException('验证码不存在或已失效');
    } else {
      const code = session.code;
      delete session.code;
      if (validateCode !== code) throw new UnauthorizedException('验证码错误');
    }

    if (!username || !password) {
      throw new UnauthorizedException('用户名或密码不能为空');
    }
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}
