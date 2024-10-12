import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';

// 必须先在@UseGuards装饰器中添加JwtAuthGuard来验证token，然后再使用AdminGuard来验证是否是管理员
// @UseGuards(JwtAuthGuard, AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    console.log('user', request.user);

    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }

    const user = await this.usersService.findOne(userId); // 根据用户ID获取用户信息
    if (user && user.isAdmin) {
      return true; // 允许继续执行
    }

    throw new UnauthorizedException('User is not an admin');
  }
}
