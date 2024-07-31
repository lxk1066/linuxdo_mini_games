import { ConfigService } from '@nestjs/config';
import { BullModuleAsyncOptions } from '@nestjs/bull';

const emailConfig = (configService: ConfigService) => ({
  host: configService.get('REDIS_HOST'),
  port: configService.get('REDIS_PORT'),
  password: configService.get('REDIS_PASSWORD'),
  db: configService.get('REDIS_DB_MQ'),
});

const gamesConfig = (configService: ConfigService) => ({
  host: configService.get('REDIS_HOST'),
  port: configService.get('REDIS_PORT'),
  password: configService.get('REDIS_PASSWORD'),
  db: configService.get('REDIS_DB_GAMES_MQ'),
});

const queuesConfig: BullModuleAsyncOptions[] = [
  {
    name: 'email',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      redis: emailConfig(configService),
    }),
  },
  {
    name: 'games',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      redis: gamesConfig(configService),
    }),
  },
];

export default queuesConfig;
