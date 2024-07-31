import { Module, Logger } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService, RedisClientService } from './app.service';

import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UploadModule } from 'src/modules/upload/upload.module';
import { GamesModule } from 'src/modules/games/games.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { SqlClientConfig } from './config/mysql.config';
// 使用nestjs的config模块集中管理项目配置
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JobModule } from 'src/jobs/job.module';

// cache-manager
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisOptions } from 'ioredis';
import * as redisStore from 'cache-manager-ioredis';

// 引入全局配置模块

import { RolesGuard } from './common/guard';

import { GlobalInterceptor } from './common/interceptor/global.interceptor';
import { AllExceptionsFilter } from './common/filter/any-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true, // 允许在.env环境变量中使用${}符号引用变量

      // 切换环境配置文件
      // 开发环境同时存在development和production两个配置文件，线上环境仅存在production配置文件，因此线上环境会忽略.env.development文件
      envFilePath: ['.env.development', '.env.production'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // 注入ConfigService并使用环境变量中的SQL配置
      useFactory: (configService: ConfigService) => {
        return SqlClientConfig(configService);
      },
    }),
    CacheModule.registerAsync<RedisOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB_CACHE'),
        };
      },
    }),
    UserModule,
    UploadModule,
    AuthModule,
    GamesModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [
    RedisClientService.registerAsync({
      useFactory(configService: ConfigService) {
        return new RedisClientService(
          configService.get('REDIS_DB_SESSION'),
          configService,
        );
      },
    }),
    AppService,
    Logger,
    // 注册全局守卫
    { provide: APP_GUARD, useClass: RolesGuard },
    // 注册全局拦截器
    { provide: APP_INTERCEPTOR, useClass: GlobalInterceptor },
    // 注册全局过滤器
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [RedisClientService],
})
export class AppModule {}
