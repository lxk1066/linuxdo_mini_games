import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RedisClientService } from 'src/app.service';
import { Player } from 'src/modules/games/common/Player.model';

// module gameModule
import { GamesService as GamesModuleService } from 'src/modules/games/games.service';

import luaScript from './lua';

import global from 'src/utils/global';

@Injectable()
export class GamesService {
  private luaScript: string;
  constructor(
    @InjectQueue('games') private readonly gamesQueue: Queue,
    private readonly redisClientService: RedisClientService,
    private readonly gamesModuleService: GamesModuleService,
  ) {}

  async processPlayer(player: Player): Promise<void> {
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
        state: 'matching',
        score: player.score.toString(),
        matchTime: player.matchTime.toString(),
        compositeScore: player.compositeScore.toString(),
      });
    } else {
      const state = await this.redisClientService.hget(
        `player:${player.id}`,
        'state',
      );

      if (state !== 'matching') return;
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
    if (!this.luaScript) {
      const script = await this.redisClientService.loadScript(luaScript);
      this.luaScript = script as string;
    }

    const res = await this.redisClientService.eval(this.luaScript, [
      'matching',
    ]);
    console.log('lua 执行结果：', res[0][0], res[1][0]);

    return {
      playerId1: parseInt(res[0][0].replace('player:', '')),
      playerId2: parseInt(res[1][0].replace('player:', '')),
    };
  }

  // 从游戏列表中随机选择一个
  async getRandomGame() {
    const game = await this.gamesModuleService.getRandomGame();
    return game.id;
  }

  async createGameRoom(
    playerId1: number,
    playerId2: number,
    miniGameId: number,
  ): Promise<string> {
    const gameId = `game:${Date.now()}`;

    await this.redisClientService.hmset(gameId, {
      gameId,
      gameTypeId: miniGameId.toString(),
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

  // 匹配成功，根据两名玩家的playerId向玩家客户端发送消息
  async sendMatchSuccessMessage(
    playerId1: number,
    playerId2: number,
    gameId: string,
    miniGameId: number,
  ): Promise<void> {
    try {
      await this.sendMessageToPlayer(
        playerId1,
        'matchSuccess',
        JSON.stringify({
          gameId,
          miniGameId,
          otherPlayer: playerId2,
        }),
      );

      await this.sendMessageToPlayer(
        playerId2,
        'matchSuccess',
        JSON.stringify({
          gameId,
          miniGameId,
          otherPlayer: playerId1,
        }),
      );
    } catch (error) {
      console.log('sendMatchSuccessMessage error:', error);
    }
  }

  // 根据玩家的playerId获取玩家的SocketId,然后发送消息给玩家
  async sendMessageToPlayer(
    playerId: number,
    msgType: string,
    data: any,
  ): Promise<void> {
    const socketId = await this.redisClientService.get(
      `playerSocket:${playerId}`,
    );
    if (!socketId) return;

    // 发送消息给玩家
    const socket = global.server.sockets.get(socketId);
    socket.emit(msgType, data);
  }

  async getGameRoomById(gameId: string): Promise<any> {
    const game = await this.redisClientService.hgetall(gameId);
    return game;
  }
}
