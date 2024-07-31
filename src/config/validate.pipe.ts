import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// 校验字段管道
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metaData: ArgumentMetadata) {
    // value：需要校验的数据，如果是校验请求体则value就是请求体的数据
    // metaData：元信息
    const { metatype } = metaData;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const DTO = plainToInstance(metatype, value); // 将DTO类转换（映射）成实例对象
    const errors = await validate(DTO); // 校验实例化的DTO对象，返回错误对象的数组
    if (errors.length > 0) {
      const res = errors.map((error) => ({
        field: error.property,
        constraints: error.constraints,
      }));
      throw new BadRequestException({ errors: res, type: 'dto' });
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
