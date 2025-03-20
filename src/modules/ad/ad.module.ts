import { Module } from '@nestjs/common';
import { AdService } from './ad.service';
import { AdController } from './ad.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ad as AdEntity } from './entities/ad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdEntity])],
  controllers: [AdController],
  providers: [AdService],
  exports: [],
})
export class AdModule {}
