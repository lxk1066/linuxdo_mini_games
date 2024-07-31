import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to NestJS!';
  }
}

@Injectable()
export class RedisClientService {
  private redisClient: Redis;

  constructor(
    private readonly dbIndex: number,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: this.dbIndex,
    });

    this.init();
  }

  init() {
    this.redisClient.on('connect', () => {
      console.log('Redis client connected Successful!');
    });

    this.redisClient.on('error', (err) => {
      // 可以选择不抛出异常而是仅打印错误日志，工具会自动降级使用当前计算机内存(:memory:)来存储，
      // 但是对于其他使用了Redis的服务来说，可能会导致整个服务不可用，所以这里抛出异常会暂停NestJS运行
      throw new InternalServerErrorException(
        'Redis client error: ' + JSON.stringify(err),
      );
    });

    this.redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });
  }

  static register(dbIndex: number, configService: ConfigService) {
    return new RedisClientService(dbIndex, configService);
  }

  static registerAsync({
    useFactory,
  }: {
    useFactory: (configService: ConfigService) => RedisClientService;
  }) {
    return {
      provide: RedisClientService,
      useFactory: useFactory,
      inject: [ConfigService],
    };
  }

  getRedisClient(): Redis {
    return this.redisClient;
  }

  async flushdb(): Promise<void> {
    await this.redisClient.flushdb();
  }

  async get(key: string): Promise<string> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  // hash set: key field value
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redisClient.hset(key, field, value);
  }

  async hmset(key: string, hash: { [key: string]: string }): Promise<void> {
    await this.redisClient.hmset(key, hash);
  }

  // hash get: key field
  async hget(key: string, field: string): Promise<string> {
    return await this.redisClient.hget(key, field);
  }

  async hgetall(key: string): Promise<{ [key: string]: string }> {
    return await this.redisClient.hgetall(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redisClient.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number, withScores = false) {
    return await this.redisClient.zrange(
      key,
      start,
      stop,
      withScores ? 'WITHSCORES' : undefined,
    );
  }

  async zrangebyscore(
    key: string,
    min: number | '+inf' | '-inf',
    max: number | '+inf' | '-inf',
    withScores = false,
    limit?: [number, number],
  ) {
    if (!limit) {
      return await this.redisClient.zrangebyscore(
        key,
        min,
        max,
        withScores ? 'WITHSCORES' : undefined,
      );
    } else {
      return await this.redisClient.zrangebyscore(
        key,
        min,
        max,
        withScores ? 'WITHSCORES' : undefined,
        'LIMIT',
        limit[0],
        limit[1],
      );
    }
  }

  async zrevrangebyscore(
    key: string,
    min: number | '+inf' | '-inf',
    max: number | '+inf' | '-inf',
    withScores = false,
    limit?: [number, number],
  ) {
    if (!limit) {
      return await this.redisClient.zrevrangebyscore(
        key,
        min,
        max,
        withScores ? 'WITHSCORES' : undefined,
      );
    } else {
      return await this.redisClient.zrevrangebyscore(
        key,
        min,
        max,
        withScores ? 'WITHSCORES' : undefined,
        'LIMIT',
        limit[0],
        limit[1],
      );
    }
  }

  async zrem(key: string, ...member: string[]): Promise<void> {
    await this.redisClient.zrem(key, member);
  }

  async zcard(key: string): Promise<number> {
    return await this.redisClient.zcard(key);
  }

  async zscore(key: string, member: string): Promise<string> {
    return await this.redisClient.zscore(key, member);
  }
}

// redis hash -> 匹配玩家信息
// key: `player:${playerId}` value: { state: '', score: 0, matchTime: 0 }

// redis sorted set -> 匹配玩家列表
// key: `matching`, score: playerScore * 1.5 + matchTime, member: `player:${playerId}`

// redis hash -> 游戏房间信息
// key: `game:${gameId}`, value: { gameId: '', gameType: '', gameState: '', gameStartTime: '', player1: '', player2: '', player1Score: 0, player2Score: 0 }

// 流程：
// 1. 玩家点击匹配按钮，将其加入到匹配队列中，并将状态设置为waiting
// 2. 接着计算获取匹配列表中score最相近的两名玩家(score<=100)，如果匹配成功，则将两个玩家的状态设置为Matched，并从匹配列表中移除，加入到游戏房间中
// 3. 如果匹配失败，则什么都不做，当有新玩家加入匹配列表时，重新执行第二步。
// 4. 玩家会不断的获取自己的匹配状态，当一名玩家等待时间超过10秒，则重新执行第二步，但是匹配条件改为score<=200，当匹配时间超过20秒，则匹配条件改为score<=300，以此类推
// 5. 当玩家点击开始游戏按钮，则将状态设置为Ready，当所有玩家都ready，则将状态设置为InGame，当有一名玩家断开连接，则将状态设置为Disconnected，当所有玩家都断开连接，则将状态设置为Finished，当有一名玩家退出游戏，则将状态设置为Finished
