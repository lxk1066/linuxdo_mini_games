import { Module, Logger, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from 'src/modules/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { OAuth2Strategy } from './oauth.strategy';
import { JwtModule } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get('JWT_SECRET');
        const expiresIn = configService.get('JWT_EXPIRES');
        if (!secret || !expiresIn) {
          console.log(
            new InternalServerErrorException('JWT密钥为空，请联系管理员'),
          );
          throw new InternalServerErrorException('JWT密钥为空，请联系管理员');
        } else {
          return {
            secret: configService.get('JWT_SECRET'),
            signOptions: {
              expiresIn: configService.get('JWT_EXPIRES'),
            },
          };
        }
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, OAuth2Strategy, Logger],
  exports: [AuthService, OAuth2Strategy],
})
export class AuthModule {}
