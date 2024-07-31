import { Injectable } from '@nestjs/common';
import { GamesService as GamesJobService } from 'src/jobs';
import { RedisClientService } from 'src/app.service';
import { Player } from './common/Player.model';

@Injectable()
export class GamesService {
  constructor(
    private readonly gamesJobService: GamesJobService,
    private readonly redisClientService: RedisClientService,
  ) {}

  async setUserId(playerId, socketId) {
    await this.redisClientService.set(`playerSocket:${playerId}`, socketId);
  }
  async delUserId(playerId) {
    await this.redisClientService.del(`playerSocket:${playerId}`);
  }

  async matchJoin(playerId, data) {
    const { score } = data;
    const player = new Player(playerId, score, Date.now());
    try {
      await this.gamesJobService.processPlayer(player);
      return 'ok';
    } catch (error) {
      return error;
    }
  }

  matchStatus() {
    return `matchStatus`;
  }

  matchReady() {
    return `matchReady`;
  }

  playStart() {
    return `playStart`;
  }

  playEnd() {
    return `playEnd`;
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

  playerDisconnect(playerId) {
    // 删除玩家socketId
    this.delUserId(playerId);
    // 删除玩家信息
    this.redisClientService.del(`player:${playerId}`);
    // 删除匹配列表信息 Sorted Set
    this.redisClientService.zrem('matching', `player:${playerId}`);

    return `playerDisconnect`;
  }
}
