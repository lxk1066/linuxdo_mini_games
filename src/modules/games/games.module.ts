import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesWSGateway } from './games.gateway';

import { JobModule } from 'src/jobs/job.module';

import { RedisClientService } from 'src/app.service';

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [JobModule],
  controllers: [GamesController],
  providers: [
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
})
export class GamesModule {}
