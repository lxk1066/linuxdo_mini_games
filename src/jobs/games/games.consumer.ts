import { Processor, Process, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { RedisClientService } from 'src/app.service';
import { GamesService } from './games.service';

@Processor('games')
export class GamesConsumer {
  private readonly logger = new Logger(GamesConsumer.name);
  constructor(
    private readonly redisClient: RedisClientService,
    private readonly gamesService: GamesService,
  ) {}

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name}, completed. ${JSON.stringify(job.returnvalue)}`,
    );

    if (job.returnvalue) {
      const { playerId1, playerId2 } = job.returnvalue.matchedPlayers;
      this.gamesService.sendMatchSuccessMessage(
        playerId1,
        playerId2,
        job.returnvalue.gameId,
        job.returnvalue.miniGameId,
      );
    }
  }

  @Process('match')
  async handleMatch(): Promise<{
    gameId: string;
    miniGameId: number;
    matchedPlayers: { playerId1: number; playerId2: number };
  }> {
    try {
      // 获取当前匹配队列的人数
      const count = await this.redisClient.zcard('matching');
      if (count < 2) {
        // 如果人数少于两人，无需匹配
        return null;
      }

      // 尝试匹配
      const matchedPlayers = await this.gamesService.attemptMatch();

      if (matchedPlayers) {
        // 匹配成功
        console.log(
          `Match found between ${matchedPlayers.playerId1} and ${matchedPlayers.playerId2}`,
        );

        // 随机小游戏
        const miniGameId = await this.gamesService.getRandomGame();

        // 移除玩家
        await this.redisClient.zrem(
          'matching',
          `player:${matchedPlayers.playerId1}`,
          `player:${matchedPlayers.playerId2}`,
        );

        // 更新玩家状态为 "matchSuccess"
        await this.redisClient.hset(
          `player:${matchedPlayers.playerId1}`,
          'state',
          'matchSuccess',
        );
        await this.redisClient.hset(
          `player:${matchedPlayers.playerId2}`,
          'state',
          'matchSuccess',
        );

        // 创建游戏房间
        const gameId = await this.gamesService.createGameRoom(
          matchedPlayers.playerId1,
          matchedPlayers.playerId2,
          miniGameId,
        );
        console.log('创建游戏房间: ', gameId);
        return { gameId, matchedPlayers, miniGameId };
      } else {
        console.log('No suitable match found.');
        return null;
      }
    } catch (error) {
      console.error('Error during matching:', error);
    }
  }
}
