import { Length, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsEmail({}, { message: '邮箱地址格式不正确' })
  @ApiProperty({ example: 'admin@qq.com', description: '邮箱地址' })
  email: string;

  @IsString({ message: '验证码必须是字符串' })
  @ApiProperty({ example: '123456', description: '邮箱验证码' })
  emailCode: string;

  @IsString({ message: '用户名必须是字符串' })
  @Length(4, 20, { message: '用户名长度在4-20位之间' })
  @ApiProperty({ example: 'admin', description: '用户名' })
  username: string;

  @IsString({ message: '密码必须是字符串' })
  @Length(6, 20, { message: '密码长度在6-20位之间' })
  @ApiProperty({ example: '123456', description: '密码' })
  password: string;
}

export class SendEmailDto {
  @IsEmail({}, { message: '邮箱地址格式不正确' })
  @ApiProperty({ example: 'admin@qq.com', description: '邮箱地址' })
  email: string;
}
