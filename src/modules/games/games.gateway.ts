import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';

import global from 'src/utils/global';

@WebSocketGateway({ namespace: 'games', cors: '*' })
export class GamesWSGateway {
  constructor(private readonly gamesService: GamesService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('setUserId')
  setUserId(
    @MessageBody() playerId: number,
    @ConnectedSocket() client: Socket,
  ): any {
    (client as any).playerId = playerId;
    this.gamesService.setUserId(playerId, client.id);
    return { type: 'setUserId', data: playerId };
  }

  @SubscribeMessage('matchJoin')
  async matchJoin(
    @MessageBody() data: { playerId: number; score: number },
  ): Promise<any> {
    console.log('matchJoin', data);
    const res = await this.gamesService.matchJoin(data.playerId, data);
    return { type: 'matchJoin', data: res };
  }

  @SubscribeMessage('matchCancel')
  async matchCancel(@MessageBody() data: { playerId: number }): Promise<any> {
    await this.gamesService.matchCancel(data.playerId);
    return { type: 'matchCancel', data: 'ok' };
  }

  @SubscribeMessage('matchStatus')
  matchStatus(@MessageBody() data: string): any {
    return { type: 'matchStatus', data };
  }

  @SubscribeMessage('matchReady')
  async matchReady(@MessageBody() data: string): Promise<any> {
    const userData = JSON.parse(data);
    const { playerId } = userData;
    // 获取房间信息
    const gameInfo = await this.gamesService.getGameInfoByPlayerId(playerId);
    // 玩家客户端响应准备，将玩家的状态更改为准备状态
    const res = await this.gamesService.matchReady(playerId);
    // 判断另一位玩家的的状态，如果双方都准备好了，才能开始游戏，并向客户端发送游戏开始事件
    if (res == 'ok')
      this.gamesService.checkOtherPlayerStatus(gameInfo, playerId);

    return { type: 'matchReady', res };
  }

  @SubscribeMessage('playStart')
  playStart(@MessageBody() data: string): any {
    return { type: 'playStart', data };
  }

  @SubscribeMessage('playEnd')
  async playEnd(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    const Data = JSON.parse(data);
    // 通过当前socketId获取玩家id并修改玩家状态 然后获取玩家的roomId，将成绩写入游戏房间的成绩
    const res = await this.gamesService.playEnd(Data.score, client);
    // 检测另一名玩家是否完成游戏
    if (res.res == 'ok') {
      this.gamesService.checkOtherPlayerEnd(res.roomId, res.players, client);
    }
    return { type: 'playEnd', res: res.res };
  }

  @SubscribeMessage('getPlayStatus')
  getPlayStatus(@MessageBody() data: string): any {
    return { type: 'getPlayStatus', data };
  }

  @SubscribeMessage('playResult')
  playResult(@MessageBody() data: string): any {
    return { type: 'playResult', data };
  }

  emitClientMessage(event: string, data: any) {
    this.server.emit(event, data);
  }

  public emitClientMessageToSpecificClient(
    socketId: string,
    event: string,
    data: any,
  ) {
    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    } else {
      console.error(`Socket with id ${socketId} not found.`);
    }
  }

  // 以下是三个 WebSocketGateway生命周期hook
  afterInit() {
    console.log('OnGatewayInit');
    // 将服务器实例保存到全局变量中
    global.server = this.server as any;
    this.gamesService.OnGatewayInit();
  }

  handleConnection() {
    console.log('On User Connection');
  }

  handleDisconnect(e) {
    console.log('On User Disconnect ', e.playerId);
    this.gamesService.playerDisconnect(e.playerId);
  }
}
