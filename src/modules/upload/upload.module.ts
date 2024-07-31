import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { UploadController, DownloadController } from './upload.controller';
import { uploadConfig } from 'src/config/upload.config';

@Module({
  controllers: [UploadController, DownloadController],
  providers: [UploadService],
  imports: [
    ConfigModule,
    // 上传文件
    uploadConfig('UPLOAD_FILES_PATH'),
  ],
  exports: [UploadService],
})
export class UploadModule {}
