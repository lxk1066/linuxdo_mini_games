import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Ad } from './entities/ad.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Injectable()
export class AdService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Ad) private readonly adRepository: Repository<Ad>,
  ) {}

  async findAll() {
    return await this.adRepository.find();
  }

  async add(ad: CreateAdDto) {
    if (
      await this.adRepository.findOne({
        where: {
          title: ad.title,
        },
      })
    ) {
      throw new HttpException('广告名称重复', HttpStatus.BAD_REQUEST);
    }
    return await this.adRepository.save(ad);
  }

  async deleteById(id: number) {
    const ad = await this.adRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!ad) {
      throw new HttpException('广告不存在', HttpStatus.BAD_REQUEST);
    } else {
      return await this.adRepository.delete(id);
    }
  }

  async update(id: number, body: UpdateAdDto) {
    const ad = await this.adRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!ad) {
      throw new HttpException('广告不存在', HttpStatus.BAD_REQUEST);
    } else {
      return await this.adRepository.update(id, body);
    }
  }
}
