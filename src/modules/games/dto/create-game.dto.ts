import { Length, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @IsString({ message: '游戏名称必须是字符串' })
  @ApiProperty({ example: '贪吃蛇', description: '游戏名称' })
  name: string;

  @IsString({ message: '游戏描述必须是字符串' })
  @ApiProperty({ example: '贪吃蛇小游戏', description: '游戏描述' })
  description: string;

  @IsString({ message: '游戏页面路径必须是字符串' })
  @ApiProperty({
    example: '/games/snake/index.html',
    description: '游戏页面路径',
  })
  path: string;

  @IsOptional()
  @IsString({ message: '作者名称必须是字符串' })
  @Length(4, 20, { message: '作者名称长度在4-20位之间' })
  @ApiProperty({ example: 'admin', description: '作者名称' })
  author: string;

  @IsOptional()
  @IsString({ message: '作者联系方式必须是字符串' })
  @Length(6, 255, { message: '联系方式长度在6-255位之间' })
  @ApiProperty({ example: '123456@qq.com', description: '作者联系方式' })
  authorContact: string;
}
