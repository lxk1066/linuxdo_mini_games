/**
 * 全局配置
 */
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const SqlClientConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const config = {
    type: configService.get<any>('DB_TYPE'), // 数据库类型
    host: configService.get('DB_HOST'), // 数据库地址
    port: configService.get('DB_PORT'), // 数据库端口
    username: configService.get('DB_USERNAME'), // 数据库用户名
    password: configService.get<string>('DB_PASSWORD'), // 数据库密码
    database: configService.get<string>('DB_DATABASE'), // 数据库名
    synchronize: Boolean(configService.get<string>('DB_Synchronize')), // 是否自动建表 自动将实体类映射到数据库中
    retryDelay: configService.get<number>('DB_RetryDelay'), // 重连数据库的间隔时间
    retryAttempts: configService.get<number>('DB_RetryAttempts'), // 重连数据库的次数
    autoLoadEntities: true, // 方式二，自动扫描实体类, forFeature()方法注册的实体类将自动添加到配置对象中
  };
  // 检测配置项是否为空
  const errKeys = Object.keys(config).filter(
    (key) => config[key] === undefined,
  );
  if (errKeys.length) {
    throw new InternalServerErrorException(
      `数据库配置错误，请检查配置文件，缺少以下配置项：${errKeys.join(',')}`,
    );
  }

  return config;
};
