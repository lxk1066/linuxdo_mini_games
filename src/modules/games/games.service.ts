import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamesService as GamesJobService } from 'src/jobs';
import { RedisClientService } from 'src/app.service';
import { Player } from './common/Player.model';
import { Socket } from 'socket.io';

import getMemoryUsage from 'src/utils/getMemoryUsage';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @Inject(forwardRef(() => GamesJobService))
    private readonly gamesJobService: GamesJobService,
    private readonly redisClientService: RedisClientService,
  ) {}

  // 获取游戏列表
  async getGamesList() {
    return await this.gameRepository.find();
  }

  // 添加小游戏
  async addGame(game: CreateGameDto) {
    // 判断游戏名称是否重复
    if (
      await this.gameRepository.findOne({
        where: {
          name: game.name,
        },
      })
    ) {
      throw new HttpException('游戏名称重复', HttpStatus.BAD_REQUEST);
    }
    return await this.gameRepository.save(game);
  }

  async getGameById(id: number) {
    return await this.gameRepository.findOne({
      where: {
        id,
      },
    });
  }

  async getGameRoomById(id: string) {
    const info = await this.gamesJobService.getGameRoomById(id);

    console.log('getGameRoomById', info);
    if (info.gameId) {
      return info;
    } else {
      return '房间不存在';
    }
  }

  // 从游戏列表中随机选择一个
  async getRandomGame() {
    const games = await this.gameRepository.find();
    const randomGame = games[Math.floor(Math.random() * games.length)];
    return randomGame;
  }

  async setUserId(playerId, socketId) {
    await this.redisClientService.set(`playerSocket:${playerId}`, socketId);
  }
  async delUserId(playerId) {
    await this.redisClientService.del(`playerSocket:${playerId}`);
  }

  async getSocketId(playerId) {
    return await this.redisClientService.get(`playerSocket:${playerId}`);
  }

  async matchJoin(playerId, data) {
    // 获取当前服务器玩家人数
    const { playerCount, maxPlayerCount } = await this.getServerInfo();
    // 如果人数超过最大人数，则不予匹配
    if (playerCount >= maxPlayerCount) {
      return `当前玩家人数已达${maxPlayerCount}，请稍后再试!`;
    } else {
      const { score } = data;
      const player = new Player(playerId, score, Date.now());
      try {
        await this.gamesJobService.processPlayer(player);
        return 'ok';
      } catch (error) {
        return error;
      }
    }
  }

  // 取消匹配
  async matchCancel(playerId: string | number) {
    // 删除玩家信息
    await this.redisClientService.del(`player:${playerId}`);
    // 删除匹配列表信息 Sorted Set
    await this.redisClientService.zrem('matching', `player:${playerId}`);
  }

  matchStatus() {
    return `matchStatus`;
  }

  async matchReady(playerId: string | number) {
    // 玩家准备，校验数据，然后修改玩家状态
    try {
      await this.redisClientService.hset(
        `player:${playerId}`,
        'state',
        'matchReady',
      );
      return `ok`;
    } catch (e) {
      console.log('修改玩家状态失败');
      return e;
    }
  }

  async getGameInfoByPlayerId(playerId: number | number) {
    // 获取玩家信息
    const gameId = await this.redisClientService.hget(
      `player:${playerId}`,
      'roomId',
    );
    return await this.redisClientService.hgetall(gameId);
  }

  async checkOtherPlayerStatus(
    gameInfo: { [key: string]: any },
    playerId: string | number,
  ) {
    // 获取房间信息
    const players = await this.redisClientService.hmget(
      gameInfo.gameId,
      'player1',
      'player2',
    );

    console.log('checkOtherPlayerStatus players', players);
    const otherPlayerId = playerId == players[0] ? players[1] : players[0];

    // 获取另一名玩家的状态
    const status = await this.redisClientService.hget(
      `player:${otherPlayerId}`,
      'state',
    );

    if (status == 'matchReady') {
      // 将两名玩家的状态改为'InGame'
      // 向两名玩家发送游戏开始事件
      players.forEach((player) => {
        this.redisClientService.hset(`player:${player}`, 'state', 'InGame');
        this.gamesJobService.sendMessageToPlayer(
          parseInt(player),
          'playStart',
          JSON.stringify({ gameId: gameInfo.gameId }),
        );
      });
    }
  }

  playStart() {
    return `playStart`;
  }

  async playEnd(score: number, client: Socket) {
    try {
      // 通过当前client实例获取玩家id并修改玩家状态
      const playerId = (client as any).playerId;
      await this.redisClientService.hset(
        `player:${playerId}`,
        'state',
        'playEnd',
      );
      // 然后获取玩家的roomId，将成绩写入游戏房间的成绩
      const roomId = await this.redisClientService.hget(
        `player:${playerId}`,
        'roomId',
      );
      const players = await this.redisClientService.hmget(
        roomId,
        'player1',
        'player2',
      );
      if (players.length === 2) {
        players[0] == playerId
          ? await this.redisClientService.hset(
              roomId,
              'player1Score',
              score.toString(),
            )
          : await this.redisClientService.hset(
              roomId,
              'player2Score',
              score.toString(),
            );
      } else {
        // 有玩家已掉线
      }
      return { res: 'ok', players, roomId };
    } catch (e) {
      return e;
    }
  }

  // 检测另一名玩家是否游戏结束
  async checkOtherPlayerEnd(roomId: string, players: string[], client: Socket) {
    console.log('checkOtherPlayerEnd', roomId, players);
    const playerId = (client as any).playerId;

    const otherPlayerId = playerId == players[0] ? players[1] : players[0];

    console.log('playerId', playerId, 'otherPlayerId', otherPlayerId);
    const status = await this.redisClientService.hget(
      `player:${otherPlayerId}`,
      'state',
    );

    // 如果状态为playEnd, 则需要向两位玩家客户端发送游戏结果
    if (status == 'playEnd') {
      console.log('游戏结束');
      const scores = await this.redisClientService.hmget(
        roomId,
        'player1',
        'player1Score',
        'player2',
        'player2Score',
      );

      // 确保playerId和otherPlayerId在scores中
      if (
        !scores.includes(playerId.toString()) ||
        !scores.includes(otherPlayerId.toString())
      ) {
        console.log('对局错误', scores);
        return '对局错误';
      }

      const playerScore = playerId == scores[0] ? scores[1] : scores[3];
      const otherPlayerScore =
        otherPlayerId == scores[0] ? scores[1] : scores[3];

      players.forEach((player) => {
        this.gamesJobService.sendMessageToPlayer(
          parseInt(player),
          'playResult',
          JSON.stringify({
            playerId: playerId,
            playerScore: parseInt(playerScore),
            otherPlayerId: otherPlayerId,
            otherPlayerScore: parseInt(otherPlayerScore),
            winner:
              parseInt(playerScore) == parseInt(otherPlayerScore)
                ? 'tie'
                : parseInt(playerScore) > parseInt(otherPlayerScore)
                  ? playerId
                  : otherPlayerId,
          }),
        );
      });

      return 'ok';
    }
  }

  getPlayStatus() {
    return `getPlayStatus`;
  }

  playResult() {
    return `playResult`;
  }

  OnGatewayInit() {
    // 清空redis所有数据
    this.redisClientService.flushdb();
  }

  async playerDisconnect(playerId) {
    // 删除玩家socketId
    this.delUserId(playerId);

    // 玩家状态分为几种情况：matching、matchSuccess、matchReady、InGame、playEnd
    const playerState = await this.redisClientService.hget(
      `player:${playerId}`,
      'state',
    );
    // 1. 如果玩家状态为matching，则将玩家信息删除，并将玩家从匹配列表中删除
    if (playerState == 'matching') {
      await this.redisClientService.del(`player:${playerId}`);
      await this.redisClientService.zrem('matching', `player:${playerId}`);
    }
    // 2. 如果玩家状态为matchSuccess，则将玩家信息删除，并将房间的玩家状态改为'playAbort', 并将两名玩家的分数改为-1，
    if (playerState == 'matchSuccess') {
      const roomId = await this.redisClientService.hget(
        `player:${playerId}`,
        'roomId',
      );
      await this.redisClientService.del(`player:${playerId}`);
      await this.redisClientService.hmset(roomId, {
        state: 'playAbort',
        player1Score: '-1',
        player2Score: '-1',
      });

      // 删除游戏房间
      this.redisClientService.del(roomId);
    }
    // 3. 如果玩家状态为matchReady，则将玩家信息删除，并将房间的玩家状态改为'playAbort'，并将两名玩家的分数改为-1，
    if (playerState == 'matchReady') {
      const roomId = await this.redisClientService.hget(
        `player:${playerId}`,
        'roomId',
      );
      await this.redisClientService.del(`player:${playerId}`);
      await this.redisClientService.hmset(roomId, {
        state: 'playAbort',
        player1Score: '-1',
        player2Score: '-1',
      });

      // 删除游戏房间
      this.redisClientService.del(roomId);
    }
    // 4. 如果玩家状态为InGame，则将玩家信息删除，并将房间的玩家状态改为'playAbort'，并将掉线玩家的分数改为-1，另一名玩家成为winner，
    if (playerState == 'InGame') {
      const roomId = await this.redisClientService.hget(
        `player:${playerId}`,
        'roomId',
      );
      const players = await this.redisClientService.hmget(
        roomId,
        'player1',
        'player2',
      );
      await this.redisClientService.del(`player:${playerId}`);

      const playerIndex = playerId == players[0] ? 1 : 2;
      await this.redisClientService.hmset(roomId, {
        state: 'playAbort',
        player1Score: playerIndex == 1 ? '-1' : undefined,
        player2Score: playerIndex == 2 ? '-1' : undefined,
      });

      // 删除游戏房间
      this.redisClientService.del(roomId);
    }
    // 5. 如果玩家状态为playEnd，则将玩家信息删除，并将房间的玩家状态改为'gameOver'.
    if (playerState == 'playEnd') {
      const roomId = await this.redisClientService.hget(
        `player:${playerId}`,
        'roomId',
      );
      const players = await this.redisClientService.hmget(
        roomId,
        'player1',
        'player2',
      );
      const otherPlayerState = await this.redisClientService.hget(
        `player:${playerId == players[0] ? players[1] : players[0]}`,
        'state',
      );

      if (otherPlayerState !== 'playEnd') {
        // 如果另一名玩家在游戏中，则将房间状态改为gameOver
        await this.redisClientService.hset(roomId, 'state', 'gameOver');
        await this.redisClientService.del(`player:${playerId}`);
      } else {
        // 如果另一名玩家已经游戏结束，则删除房间信息
        await this.redisClientService.del(`player:${playerId}`);
        await this.redisClientService.del(roomId);
      }
    }

    return `playerDisconnect`;
  }

  // 获取当前玩家人数和服务器内存使用率
  async getServerInfo() {
    const maxPlayerCount = 100;
    // 获取所有以player:开头的key
    const playerCount = await this.redisClientService
      .keys('player:*')
      .then((keys) => keys.length);
    const memoryUsage = getMemoryUsage();
    return {
      maxPlayerCount,
      playerCount,
      memoryUsage: memoryUsage.memoryUsage,
    };
  }
}
