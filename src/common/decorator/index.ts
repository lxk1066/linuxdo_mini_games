import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

// 自定义装饰器，将角色信息保存到请求处理函数的 metadata(元数据) 中
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const userInfo = createParamDecorator(
  (param: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request?.user ?? {};

    return user[param] || user;
  },
);
