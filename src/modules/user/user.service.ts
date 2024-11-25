import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { InvitationKey } from './entities/invitationKey.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as fs from 'fs-extra';
import { Snowflake } from 'node-snowflake';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../upload/upload.service';

import { hashPassword } from 'src/utils/bcryptUtils';

import randomCode from 'src/utils/randomCode';

import { EmailService } from 'src/jobs';

@Injectable()
export class UserService {
  constructor(
    // 注入实体类
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(InvitationKey)
    private readonly InvitationKeyRepository: Repository<InvitationKey>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
    private readonly emailService: EmailService,
  ) {}

  // 创建用户 / 注册
  async create(createUserDto: CreateUserDto) {
    // 验证邀请码是否有效
    const invitationKey = await this.InvitationKeyRepository.findOne({
      where: { key: createUserDto.invitationKey, used: false },
    });
    if (!invitationKey) throw new HttpException('邀请码无效', 400);
    else invitationKey.used = true;

    // 验证邮箱是否存在
    const oldUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email OR user.username = :username', {
        email: createUserDto.email,
        username: createUserDto.username,
      })
      .getOne();
    if (oldUser) throw new HttpException('用户名或邮箱地址已被注册', 400);
    // 验证邮箱验证码
    await this.validateEmailCode(createUserDto.email, createUserDto.emailCode);

    const user = new User();
    user.id = Number(Snowflake.nextId());
    user.userType = 'platform';
    user.email = createUserDto.email;
    user.username = createUserDto.username;
    user.nickname = createUserDto.nickname;
    user.password = await hashPassword(createUserDto.password);

    // 将邀请码设置为已使用
    await this.InvitationKeyRepository.save(invitationKey);

    // 保存用户
    return this.userRepository.save(user);
  }

  findAll(query?: { name?: string }) {
    if (query?.name) {
      return this.userRepository.find({
        where: { username: Like(`%${query.name}%`) },
      });
    } else {
      return this.userRepository.find();
    }
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  findOneByName(username: string) {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  // 该方法仅限登录时校验密码使用，因为会返回用户密码
  findOneToValidate(username: string) {
    return this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password'],
    });
  }

  // 该方法用于OAuth登录时自动创建用户或更新用户信息
  async findOrCreate(userInfo: {
    id: number;
    username: string;
    nickname: string;
    email: string;
    avatar: string;
    trustLevel: number;
  }) {
    const user = await this.userRepository.findOne({
      where: { id: userInfo.id },
    });
    if (user) {
      // 如果用户名、昵称、头像发送变化，则更新用户信息
      if (
        user.username !== userInfo.username ||
        user.nickname !== userInfo.nickname ||
        user.avatar !== userInfo.avatar
      ) {
        await this.userRepository.update(user.id, userInfo);
        return userInfo;
      } else {
        return user;
      }
    } else {
      const newUser = new User();
      for (const key in userInfo) {
        newUser[key] = userInfo[key];
      }
      return this.userRepository.save(newUser);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const { username } = updateUserDto;
      const res = await this.userRepository.update(id, { username });
      return res.affected < 1 ? '更新失败' : '更新成功';
    } catch (error) {
      console.log(error);
      throw new HttpException('服务器错误', 500);
    }
  }

  async updateUsername(id: number, username: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['username'],
    });
    if (!user) throw new HttpException('用户不存在', 400);
    const res = await this.userRepository.update(id, { username: username });
    return res.affected < 1 ? '更新失败' : '更新成功';
  }

  async updateAvatar(id: number, avatar: string) {
    try {
      const old = await this.userRepository.findOne({
        where: { id },
        select: ['avatar'],
      });

      const res = await this.userRepository.update(id, { avatar });
      if (res.affected < 1) throw new HttpException('用户信息更新失败', 400);

      // 删除旧头像
      if (old.avatar !== 'default.png') {
        const data = await this.uploadService.checkUserAvatar(old.avatar);
        if (data) await fs.remove(data.url).catch(() => {});
      }
    } catch (error) {
      if (error.status !== 400) throw new InternalServerErrorException(error);
      throw new HttpException('用户信息更新失败', 400);
    }
  }

  async remove(id: number) {
    try {
      const res = await this.userRepository.delete(id);
      return res.affected < 1 ? '删除失败' : '删除成功';
    } catch (error) {
      throw new HttpException('服务器错误', 500);
    }
  }

  async sendEmailCode(email: string) {
    const code = randomCode(6);
    const codeTime = this.configService.get('EMAIL_CODE_TIME') || 1000 * 60;
    const emailFrom = this.configService.get('EMAIL_FROM');

    this.emailService.sendEmail(
      `[${emailFrom}]注册验证码`,
      email,
      `尊敬的用户您好，你正在[${emailFrom}]平台注册成为用户，请使用验证码完成注册，验证码：${code}。验证码5分钟内有效，请勿将验证码告知任何人。`,
    );
    this.cache.set(email, code, parseInt(codeTime));
  }

  async validateEmailCode(email: string, emailCode: string) {
    const code = await this.cache.get<string>(email);
    console.log('validateEmailCode', code);
    if (!code) {
      throw new HttpException('验证码不存在或已过期', 401);
    }
    console.log('code', code, emailCode);
    if (String(code) !== emailCode) {
      throw new HttpException('验证码错误', 401);
    }

    await this.cache.del(email);
    return true;
  }

  // 随机获取一个未使用的邀请码
  async getOneInviteCode(): Promise<string> {
    const keys = await this.InvitationKeyRepository.find({
      where: { used: false },
    });

    if (keys.length === 0) {
      throw new HttpException('邀请码不足', 401);
    }
    return keys[Math.floor(Math.random() * keys.length)].key;
  }

  // 获取id为1的邀请码，作为随机获取验证码的秘钥
  async getInviteCodeSecret(): Promise<string> {
    try {
      const key = await this.InvitationKeyRepository.findOne({
        where: { id: 1 },
      });
      return key.key;
    } catch (error) {
      throw new InternalServerErrorException('服务器错误');
    }
  }

  // 生成指定数量的邀请码
  async generateInviteCode(num: number): Promise<string[]> {
    const queryRunner =
      this.InvitationKeyRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const codeList = [];
      const inviteKeys = [];

      for (let i = 0; i < num; i++) {
        const code = this.randomCode(10);
        const inviteKey = new InvitationKey();
        inviteKey.key = code;
        codeList.push(code);
        inviteKeys.push(inviteKey);
      }

      // 使用 queryRunner 的 manager 批量保存实体
      await queryRunner.manager.save(inviteKeys);

      // 提交事务
      await queryRunner.commitTransaction();

      return codeList;
    } catch (err) {
      // 如果发生错误，回滚事务
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err);
    } finally {
      // 释放 queryRunner
      await queryRunner.release();
    }
  }

  // 生成随机邀请码
  private randomCode(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }
}
