import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// 定义局部中间件并注入到IoC容器中
@Injectable()
export class IndexMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('index middleware', req.method);
    next();
  }
}

// 定义全局中间件并在main.ts中注册
// 全局中间件只能使用函数语法
export function GlobalMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log('global middleware', req.method);
  next();
}
