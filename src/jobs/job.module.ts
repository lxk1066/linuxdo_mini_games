import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { EmailService } from './email/email.service';
import { NodemailerService } from './email/nodemailer.service';
import { EmailConsumer } from './email/email.consumer';

import { GamesService } from './games/games.service';
import { GamesConsumer } from './games/games.consumer';

import queuesConfig from './queues.config';

import { RedisClientService } from 'src/app.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [BullModule.registerQueueAsync(...queuesConfig)],
  providers: [
    EmailService,
    NodemailerService,
    EmailConsumer,
    GamesService,
    GamesConsumer,
    RedisClientService.registerAsync({
      useFactory(configService: ConfigService) {
        return RedisClientService.register(
          configService.get('REDIS_DB_GAMES_INFO'),
          configService,
        );
      },
    }),
  ],
  exports: [EmailService, GamesService],
})
export class JobModule {}
