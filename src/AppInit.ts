import { VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import projectRootPath from './utils/projectRootPath';
import { join } from 'path';

import { RedisClientService } from './app.service';
import { RedisIoAdapter } from './modules/games/common/redis-io.adapter';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// session相关配置
import * as Session from 'express-session';
import RedisStore from 'connect-redis';

// 全局中间件
import { GlobalMiddleware } from './common/middleware';
// 全局管道
import { ValidationPipe } from './config/validate.pipe';

export default async function AppInit(app: NestExpressApplication) {
  const configService = app.get(ConfigService);
  const redisClient = new RedisClientService(5, configService).getRedisClient();

  // 设置全局接口前缀
  // app.setGlobalPrefix('api');

  // 使用helmet保护站点, 免受一些众所周知的 Web 漏洞的影响
  app.use(helmet());

  // 使用express-rate-limit对站点限流，防止被暴力攻击
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000, // 10分钟
      max: 100, // 每个IP在指定时间（windowMs）内，最大100次请求
    }),
  );

  // 开启cors跨域
  const whitelist = configService
    .get<string>('CORS_ORIGIN_WHITELIST')
    .split(',');
  app.enableCors({
    origin: whitelist,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'], // 允许的自定义请求头
    credentials: true, // 允许发送cookies
  });

  // 开启全局中间件
  app.use(GlobalMiddleware);

  // 开启静态文件访问
  // 使用配置中的静态资源路径
  const staticAssetsPath = configService.get<string>('STATIC_FILES_PATH');
  const __dirname = await projectRootPath();

  app.useStaticAssets(join(__dirname, staticAssetsPath), { prefix: '/images' });

  // 开启版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // 开启Session
  app.use(
    Session({
      secret: configService.get<string>('SESSION_SECRET'),
      name: configService.get<string>('SESSION_KEY'),
      cookie: {
        maxAge: Number.parseInt(configService.get('SESSION_MAX_AGE')) * 1000,
        httpOnly: true,
      },
      rolling: true, // 刷新session
      resave: false, // 只有在会话数据发生变化时才保存会话，避免不必要的IO操作
      saveUninitialized: false, // 不会为未初始化的会话（即未设置任何属性的新会话）创建存储记录，有助于减少服务器负载并提高安全性
      // session存储在redis中
      store: new RedisStore({
        client: redisClient,
        ttl: configService.get<number>('SESSION_MAX_AGE'),
      }),
    }),
  );

  // 为WebSocket开启新的IoAdapter
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  // 开启全局验证管道
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     errorHttpStatusCode: 401,
  //   }),
  // );
  app.useGlobalPipes(new ValidationPipe());

  // 开启 swagger 文档
  const swaggerOptions = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('MeetU API')
    .setDescription('API文档')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('swagger', app, swaggerDocument);
}
