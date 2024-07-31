import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';

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
  matchJoin(@MessageBody() data: { playerId: number; score: number }): any {
    const res = this.gamesService.matchJoin(data.playerId, data);
    return { type: 'matchJoin', data: res };
  }

  @SubscribeMessage('matchStatus')
  matchStatus(@MessageBody() data: string): any {
    return { type: 'matchStatus', data };
  }

  @SubscribeMessage('matchReady')
  matchReady(@MessageBody() data: string): any {
    return { type: 'matchReady', data };
  }

  @SubscribeMessage('playStart')
  playStart(@MessageBody() data: string): any {
    return { type: 'playStart', data };
  }

  @SubscribeMessage('playEnd')
  playEnd(@MessageBody() data: string): any {
    return { type: 'playEnd', data };
  }

  @SubscribeMessage('getPlayStatus')
  getPlayStatus(@MessageBody() data: string): any {
    return { type: 'getPlayStatus', data };
  }

  @SubscribeMessage('playResult')
  playResult(@MessageBody() data: string): any {
    return { type: 'playResult', data };
  }

  // 以下是三个 WebSocketGateway生命周期hook
  afterInit() {
    console.log('OnGatewayInit');
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
