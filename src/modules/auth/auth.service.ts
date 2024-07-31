import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

import { comparePassword } from 'src/utils/bcryptUtils';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // 用于登录时验证用户名和密码
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOneToValidate(username);
    if (user && (await comparePassword(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  // 在完成validateUser方法的验证后，颁发签名jwt
  login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      user,
      access_token: this.jwtService.sign(payload), // 签名jwt
    };
  }
}
