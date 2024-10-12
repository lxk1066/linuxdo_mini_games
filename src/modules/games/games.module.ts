import { Module, forwardRef } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesWSGateway } from './games.gateway';

import { AdminGuard } from 'src/common/guard';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Game as GameEntity } from './entities/game.entity';

import { JobModule } from 'src/jobs/job.module';

import { RedisClientService } from 'src/app.service';

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity]),
    forwardRef(() => JobModule),
  ],
  controllers: [GamesController],
  providers: [
    AdminGuard,
    GamesService,
    GamesWSGateway,
    RedisClientService.registerAsync({
      useFactory(configService: ConfigService) {
        return RedisClientService.register(
          configService.get('REDIS_DB_GAMES_INFO'),
          configService,
        );
      },
    }),
  ],
  exports: [GamesService],
})
export class GamesModule {}
