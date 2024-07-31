import {
  Controller,
  Get,
  Post,
  Res,
  Param,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { UploadService } from './upload.service';

// FileInterceptor 用于上传单个文件 FilesInterceptor用于上传多个文件
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: any) {
    return {
      file: {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      },
      message: 'upload success',
    };
  }
}

@Controller('download')
export class DownloadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('stream/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const data = await this.uploadService.checkFile(filename);
    if (data === false) {
      throw new NotFoundException('file not found');
    } else {
      const fileStream = createReadStream(data.url);
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      fileStream.pipe(res);
    }
  }

  @Get('export/:filename')
  async export(@Param('filename') filename: string, @Res() res: Response) {
    const data = await this.uploadService.checkFile(filename);
    if (data === false) {
      throw new NotFoundException('file not found');
    } else {
      res.download(data.url);
    }
  }
}
