import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdDto {
  @IsString({ message: '广告标题必须是字符串' })
  @ApiProperty({ example: '示例广告', description: '广告标题' })
  title: string;

  @IsString({ message: '广告描述必须是字符串' })
  @ApiProperty({ example: '广告描述', description: '广告描述' })
  description: string;

  @IsNumber({}, { message: '广告索引必须是整数' })
  @ApiProperty({
    example: 1,
    description: '广告索引，从小到大排列',
  })
  index: number;

  @IsOptional()
  @IsString({ message: '广告链接必须是字符串' })
  @ApiProperty({
    example: 'https://www.baidu.com',
    description: '广告对应的链接',
  })
  url: string;

  @IsString({ message: '广告内容必须是字符串' })
  @ApiProperty({ example: '广告内容', description: '广告内容' })
  content: string;
}
