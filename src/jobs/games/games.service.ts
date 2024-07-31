import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RedisClientService } from 'src/app.service';
import { Player } from 'src/modules/games/common/Player.model';

@Injectable()
export class GamesService {
  constructor(
    @InjectQueue('games') private readonly gamesQueue: Queue,
    private readonly redisClientService: RedisClientService,
  ) {}

  async processPlayer(player: Player): Promise<void> {
    // 更新容错值
    player.updateFaultTolerance(
      Math.floor((Date.now() - player.matchTime) / 10000),
    ); // 每10秒增加100

    const res = await this.redisClientService.zscore(
      'matching',
      `player:${player.id}`,
    );
    if (!res) {
      // 玩家不在匹配列表中

      // 将玩家添加到匹配队列
      await this.redisClientService.zadd(
        'matching',
        player.compositeScore,
        `player:${player.id}`,
      );

      // 将玩家信息添加到Redis
      await this.redisClientService.hmset(`player:${player.id}`, {
        id: player.id.toString(),
        state: 'Matching',
        score: player.score.toString(),
        matchTime: player.matchTime.toString(),
        compositeScore: player.compositeScore.toString(),
        faultTolerance: player.faultTolerance.toString(),
      });
    } else {
      const state = await this.redisClientService.hget(
        `player:${player.id}`,
        'state',
      );

      if (state !== 'Matching') return;
    }

    // 触发匹配任务
    await this.gamesQueue.add(
      'match',
      { playerId: player.id },
      { delay: 1000 },
    ); // 延迟1秒以确保玩家已添加到队列中
  }

  async attemptMatch(): Promise<{
    playerId1: number;
    playerId2: number;
  } | null> {
    const twoPlayers = await this.redisClientService.zrangebyscore(
      'matching',
      '-inf',
      '+inf',
      true,
      [0, 2],
    ); // 综合分数最相近的两名玩家
    const playerId1 = parseInt(twoPlayers[0].replace('player:', ''));
    const playerId2 = parseInt(twoPlayers[2].replace('player:', ''));

    // 获取两名玩家的信息
    const playerInfo = await Promise.all([
      this.redisClientService.hgetall(twoPlayers[0]),
      this.redisClientService.hgetall(twoPlayers[2]),
    ]).catch(async () => {
      // 如果获取玩家信息失败，则返回 null
      // 触发匹配任务
      await this.gamesQueue.add(
        'match',
        { playerId1: playerId1, playerId2: playerId2 },
        { delay: 1000 },
      );

      return null;
    });
    await this.updateFaultTolerance(playerInfo);

    // 通过两名玩家信息中的容错值匹配
    console.log('playerInfo', playerInfo);
    const abs = Math.abs(
      parseInt(playerInfo[0].score) - parseInt(playerInfo[1].score),
    );
    if (
      abs >= parseInt(playerInfo[0].faultTolerance) &&
      abs >= parseInt(playerInfo[1].faultTolerance)
    ) {
      // 触发匹配任务
      await this.gamesQueue.add(
        'match',
        { playerId1: playerId1, playerId2: playerId2 },
        { delay: 1000 },
      );

      return null;
    }

    return {
      playerId1: playerId1,
      playerId2: playerId2,
    };
  }

  async updateFaultTolerance(playerInfo: Array<any>) {
    for (const player of playerInfo) {
      const faultTolerance = Math.floor(
        (Date.now() - parseInt(player.matchTime)) / 10000,
      );

      this.redisClientService.hset(
        `player:${player.id}`,
        'faultTolerance',
        (parseInt(player.faultTolerance) + faultTolerance * 10).toString(),
      );
    }
  }

  async createGameRoom(playerId1: number, playerId2: number): Promise<string> {
    const gameId = `game:${Date.now()}`;

    await this.redisClientService.hmset(gameId, {
      gameId,
      gameType: 'two-player-match',
      gameState: 'InProgress',
      gameStartTime: Date.now().toString(),
      player1: playerId1.toString(),
      player2: playerId2.toString(),
      player1Score: '0',
      player2Score: '0',
    });

    // 将房间信息存储到玩家信息中
    await this.redisClientService.hset(`player:${playerId1}`, 'roomId', gameId);
    await this.redisClientService.hset(`player:${playerId2}`, 'roomId', gameId);

    return gameId;
  }
}
