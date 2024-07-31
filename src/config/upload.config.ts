import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import projectRootPath from 'src/utils/projectRootPath';
import generateUniqueFileName from 'src/utils/generateUniFileName';

type uploadPathType =
  | 'STATIC_FILES_PATH'
  | 'UPLOAD_FILES_PATH'
  | 'UPLOAD_AVATAR_PATH';

export const uploadConfig = (uploadPath: uploadPathType) => {
  return MulterModule.registerAsync({
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const __dirname = await projectRootPath();
      return {
        storage: diskStorage({
          destination: join(__dirname, configService.get<string>(uploadPath)),
          filename: (req, file, cb) => {
            const userId = (req.user as any).userId;
            if (!userId) return cb(new UnauthorizedException('无效Token'), '');

            const filename = generateUniqueFileName(file.originalname, userId);
            return cb(null, filename);
          },
        }),
      };
    },
  });
};
