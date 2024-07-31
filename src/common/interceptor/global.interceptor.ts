import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseData } from 'src/utils/responseData';

/**
 * 拦截器 执行时机在守卫之后，管道之前，且具有前置/后置操作
 * 前置后置操作围绕控制器执行之前/之后
 */
@Injectable()
export class GlobalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 前置操作（在进入控制器处理函数之前执行，如果挂载了管道，则会在管道之前执行）
    console.log('Request Before...');
    const response = context.switchToHttp().getResponse();

    const now = Date.now();
    return (
      next
        .handle()
        // 后置操作（如果控制器处理函数执行完成且没有抛出异常，就会执行）
        .pipe(
          // 如果执行到这里，代表当前请求从控制器执行完成，且没有抛入异常，可以放心的对响应结果进行统一包装
          // 如果在控制器的处理函数中调用response.send()进行响应，那么此处的data将被忽略(undefined)
          // 如果在控制器的处理函数中调用response.send()进行响应，那么此处的return语句将被忽略，实际响应结果依然是处理函数的response.send()
          map((data) => {
            console.log(`Request After... ${Date.now() - now}ms`);
            // console.log('Response Data: ', data);

            // const statusCode = response.statusCode; // 获取响应状态码
            response.status(HttpStatus.OK);
            return ResponseData(200, 'success', data);
          }),
        )
    );
  }
}
