import { Injectable } from '@nestjs/common';
// import { CreateUploadDto } from './dto/create-upload.dto';
import { join } from 'path';
import { promisify } from 'util';
import { stat } from 'fs';

import { ConfigService } from '@nestjs/config';
import projectRootPath from 'src/utils/projectRootPath';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}
  async checkFile(filename: string) {
    const uploadFilePath = this.configService.get<string>('UPLOAD_FILES_PATH');
    const __dirname = await projectRootPath();

    const url = join(__dirname, uploadFilePath, filename);
    const statPromise = promisify(stat);
    try {
      const data = await statPromise(url);
      if (data && data.isFile()) {
        return { url: url, size: data.size };
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  // 校验用户头像文件
  async checkUserAvatar(filename: string) {
    const avatarFilePath = this.configService.get<string>('UPLOAD_AVATAR_PATH');
    const __dirname = await projectRootPath();

    const url = join(__dirname, avatarFilePath, filename);
    const statPromise = promisify(stat);
    try {
      const data = await statPromise(url);
      if (data && data.isFile()) {
        return { url: url, size: data.size };
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }
}
