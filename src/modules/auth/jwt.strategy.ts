import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 该选项从http请求头中提取Authorization
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 如果为 true，则不验证令牌的过期时间，如果为false，jwt会自动为我们处理
      ignoreExpiration: false,
      // 和签名jwt时使用的盐值相同
      // secretOrKey: configService.get('JWT_SECRET'),

      // secretOrKey 和 secretOrKeyProvider只能二选一
      secretOrKeyProvider: (_, rawJwtToken, done) => {
        const secret = configService.get('JWT_SECRET');
        console.log('rawJwtToken', rawJwtToken);

        if (!secret) {
          console.log(
            new InternalServerErrorException('JWT密钥为空，请联系管理员'),
          );
          return done(
            new InternalServerErrorException('JWT密钥为空，请联系管理员'),
          );
        } else {
          // 如果done的第一个参数为Error实例，那么passport会抛出异常，终止passport的验证流程
          done(null, secret); // 这里的secret就是jwt的密钥，交给passport内部处理jwt验证
        }
      },
    });
  }

  // 对于 JWT 策略，Passport 会先验证 JWT 的签名并解码 payload（负载 遵循jwt规范） 。
  // 然后调用这里的 validate() 方法，该方法将解码后的 payload 作为参数传递
  async validate(payload: any) {
    if (!payload || !payload.sub || !payload.username) {
      throw new UnauthorizedException('无效的token');
    }
    return { userId: payload.sub, username: payload.username };
  }
}
