import {
  Length,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsEmail({}, { message: '邮箱地址格式不正确' })
  @ApiProperty({ example: 'admin@qq.com', description: '邮箱地址' })
  email: string;

  @IsString({ message: '验证码必须是字符串' })
  @ApiProperty({ example: '123456', description: '邮箱验证码' })
  emailCode: string;

  @IsString({ message: '邀请码必须是字符串' })
  @ApiProperty({ example: '123456', description: '邀请码' })
  invitationKey: string;

  @IsString({ message: '用户名必须是字符串' })
  @MinLength(5, { message: '用户名长度不能少于5个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: '用户名只能包含英文字母（大小写）和数字',
  })
  @ApiProperty({ example: 'admin', description: '用户名' })
  username: string;

  @IsString({ message: '昵称必须是字符串' })
  @Length(5, 20, { message: '昵称长度在5-20位之间' })
  @ApiProperty({ example: '昵称', description: '昵称' })
  nickname: string;

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
