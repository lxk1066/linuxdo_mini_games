import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

import AppInit from './AppInit';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 初始化app
  await AppInit(app);

  await app.listen(8181);
  console.log(`Application is running on: ${await app.getUrl()}`);
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
