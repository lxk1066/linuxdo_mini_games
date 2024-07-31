import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User as UserEntity } from './entities/user.entity';

import { uploadConfig } from 'src/config/upload.config';

import { JobModule } from 'src/jobs/job.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    // 上传头像配置
    uploadConfig('UPLOAD_AVATAR_PATH'),
    UploadModule,
    JobModule,
  ],
  controllers: [UserController],
  // 将提供者注入到IoC容器中
  providers: [
    UserService,
    {
      // 直接引入UserService是简写，以下这种对象形式是完整写法，provide为自定义别名
      provide: 'Test',
      useClass: UserService,
    },
    {
      // 通过useValue方式注入，将一个值类型的数据注入到IoC容器中
      provide: 'USER_REPOSITORY',
      useValue: () => {
        return {
          find: () => {
            return [
              {
                id: 1,
                name: 'user1',
                email: 'user1@user.com',
                password: '123456',
              },
              {
                id: 2,
                name: 'user2',
                email: 'user2@user.com',
              },
            ];
          },
        };
      },
    },
    {
      // 通过useFactory(工厂函数)方式注入，可以通过工厂函数动态生成数据并注入到IoC容器中
      provide: 'REPOSITORY',
      inject: ['USER_REPOSITORY'], // 使用工厂函数方式时可以注入其他依赖，从而动态生成数据
      useFactory: (userRepository: () => { find: () => any[] }) => {
        // 通过inject属性注入的依赖可以从工厂函数的参数中获取到
        const users = userRepository().find();
        return users;
      },
    },
    {
      // useFactory(工厂函数)方式注入支持异步(async/await)
      provide: 'MY_REPOSITORY',
      inject: ['USER_REPOSITORY'],
      async useFactory(userRepository: () => { find: () => any[] }) {
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve(userRepository().find());
          }, 2000);
        });
      },
    },
  ],
  exports: [UserService],
})
export class UserModule {}
