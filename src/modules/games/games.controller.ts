import { Controller, Get, Post, Body } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('/match/join')
  matchJoin(@Body() body: { playerId: number; score: number }) {
    return this.gamesService.matchJoin(body.playerId, body.score);
  }

  @Get('/match/status')
  matchStatus() {
    return this.gamesService.matchStatus();
  }

  @Post('/match/ready')
  matchReady() {
    return this.gamesService.matchReady();
  }

  @Post('/play/start')
  playStart() {
    return this.gamesService.playStart();
  }

  @Post('/play/end')
  playEnd() {
    return this.gamesService.playEnd();
  }

  @Post('/play/status/:gameId')
  getPlayStatus() {
    return this.gamesService.getPlayStatus();
  }

  @Get('/play/result/:gameId')
  playResult() {
    return this.gamesService.playResult();
  }

  @Get('/heartbeat')
  heartbeat() {
    // return this.gamesService.heartbeat();
  }
}
