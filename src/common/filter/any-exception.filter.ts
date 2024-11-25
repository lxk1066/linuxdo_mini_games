import {
  Logger,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ResponseData } from 'src/utils/responseData';

// 捕获抛出的任何异常
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    // const request = ctx.getRequest();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR,
      data: any = null,
      message: string = '服务器异常，请联系管理员！';

    console.log(`Request Error`, exception.name);

    if (exception.name === 'BadRequestException') {
      // 数据验证失败或请求参数错误
      status = HttpStatus.BAD_REQUEST;
      const response: any = exception.getResponse();
      switch (response?.type ?? null) {
        case 'dto':
          message = '验证字段错误';
          data = response.errors;
          break;
        default:
          message = exception.response.message || '请求错误';
          data = null;
          break;
      }
    } else if (exception.name === 'UnauthorizedException') {
      // 认证失败
      status = HttpStatus.UNAUTHORIZED;
      message = '认证失败';
      data = exception?.message;
    } else if (exception.name === 'HttpException') {
      // 捕获Http异常
      status = exception.getStatus();
      data = exception.getResponse() ?? null;
      message = (exception as HttpException).message ?? 'Unknown Error';
    } else if (exception.name === 'ForbiddenException') {
      status = HttpStatus.FORBIDDEN;
      message = '没有权限';
      data = exception?.message;
    } else if (exception.name === 'NotFoundException') {
      // 捕获Http异常
      status = HttpStatus.NOT_FOUND;
      data = exception.getResponse() ?? null;
      message = (exception as HttpException).message ?? 'Unknown Error';
    } else if (exception.name === 'InternalServerErrorException') {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception?.message;
      data = null;
    } else {
      // 捕获其他异常
      this.logger.error(exception);
    }

    // 基于restful风格，应返回符合语义的状态码
    // response.status(status).json(ResponseData(status, message, data));

    // 基于系统设计风格，应统一返回状态码200，通过code来判断业务状态
    response.json(ResponseData(status, message, data));
  }
}
