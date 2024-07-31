import { ExecutionContext, CanActivate, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { matchRoles } from 'src/utils/matchRoles';

/**
 * CanActivate接口额外提供了两个方法：
 * getHandler() 返回当前请求将要执行的请求处理函数的引用
 * getClass()   返回请求处理函数所在控制器的 class type
 */

// 角色鉴权守卫
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 通过反射器可以获取到请求处理函数的 metadata(元数据)
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    console.log('roles', roles);
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRoles = request?.user?.roles || []; // 获取绑定到请求对象上的用户角色信息
    return matchRoles(roles, userRoles);
  }
}
