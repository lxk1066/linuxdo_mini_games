import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Res,
  Inject,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { FileUploadDto } from './dto/file-upload.dto';
// import { Roles } from 'src/common/decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { AdminGuard } from 'src/common/guard';

import { UploadService } from '../upload/upload.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller({
  path: 'user',
  // version: '1', // 设置版本号
})
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    // 基于类构造函数的注入
    @Inject('REPOSITORY') private Repository: any,
  ) {}

  // 基于属性的注入
  @Inject('USER_REPOSITORY')
  private repository: any;

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '获取所有用户', description: '获取所有用户' })
  @ApiQuery({ name: 'name', required: false, description: '用户名' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: { name?: string }) {
    // const users = this.userRepository().find();
    // return this.userService.findAll();
    // const users = this.Repository;

    return this.userService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '获取指定ID的用户',
    description: '获取指定ID的用户',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Post('own')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '获取当前登录用户的信息',
    description: '获取当前登录用户的信息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOwn(@Req() req: any) {
    const user = await this.userService.findOne(req.user.userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      trustLevel: user.trustLevel,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: '删除指定ID的用户',
    description: '删除指定ID的用户',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // 上传用户头像
  @Post('avatar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: '上传用户头像',
    description: '上传用户头像',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传用户头像',
    required: true,
    type: FileUploadDto,
  })
  async uploadAvatar(@UploadedFile() avatar: any, @Req() req: any) {
    await this.userService.updateAvatar(req.user.userId, avatar.filename);

    return {
      avatar: {
        originalname: avatar.originalname,
        filename: avatar.filename,
        mimetype: avatar.mimetype,
        size: avatar.size,
      },
      message: 'upload success',
    };
  }

  // 下载用户头像
  @Get('avatar/:filename')
  @ApiOperation({ summary: '下载用户头像', description: '下载用户头像' })
  @ApiParam({ name: 'filename', description: '文件名' })
  async downloadAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const data = await this.uploadService.checkUserAvatar(filename);
    if (data === false) {
      throw new NotFoundException('头像未找到');
    } else {
      res.download(data.url);
    }
  }
}
