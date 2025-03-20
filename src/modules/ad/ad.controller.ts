import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { AdService } from './ad.service';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { AdminGuard } from 'src/common/guard';

import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Get('list')
  async findAll() {
    return await this.adService.findAll();
  }

  @Post('add')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async add(@Body() body: CreateAdDto) {
    return await this.adService.add(body);
  }

  @Post('deleteById/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteById(@Param('id') id: number) {
    return await this.adService.deleteById(id);
  }

  @Post('update/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: number, @Body() body: UpdateAdDto) {
    return await this.adService.update(id, body);
  }
}
