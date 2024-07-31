import { Length, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @Length(4, 20, { message: '用户名长度在4-20位之间' })
  @ApiProperty({ example: 'admin', description: '用户名' })
  username: string;
}

export class UpdateUsername {
  @IsString({ message: '用户名必须是字符串' })
  @Length(4, 20, { message: '用户名长度在4-20位之间' })
  @ApiProperty({ example: 'admin', description: '用户名' })
  username: string;
}
