import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { resolve } from 'path';

import AppInit from './AppInit';

dotenv.config();

async function bootstrap() {
  // 读取 SSL 证书文件
  const httpsOptions = {
    cert: fs.readFileSync(resolve(process.env.SSL_CERT_PATH)),
    key: fs.readFileSync(resolve(process.env.SSL_KEY_PATH)),
  };

  // 改成 http 只需要去掉 httpsOptions 即可
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  // 初始化app
  await AppInit(app);

  // 启动 HTTPS 服务器，监听 8888 端口
  await app.listen(8888, () => {
    console.log('HTTP server is running on http://localhost:8888');
  });

  console.log('============= SUCCESS =============');
  console.log('============= SUCCESS =============');
  console.log('============= SUCCESS =============');
}
bootstrap();

/**
 * Nest 框架 执行流程
 * request -> middleware -> guard -> interceptor(before) -> pipe -> controller -> interceptor(after) -> filter
 *
 * 其中：
 *  1. Controller <---> Provider 用于构成一个模块，同一个模块下可以有多个Controller和Provider，一个项目可以有多个模块
 *  2. 项目必须有一个根模块，所有的子模块必须在根模块中注册，形成树形结构。最后使用Nest工厂类将根模块注册成一个app实例。
 *
 */
