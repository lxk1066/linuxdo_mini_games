import { Controller, Param, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from 'src/common/guard';

import { CreateGameDto } from './dto/create-game.dto';

@ApiTags('Game')
@Controller('game')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('list')
  async gameList() {
    return await this.gamesService.getGamesList();
  }

  @Post('addGame')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: '添加小游戏',
    description: '添加小游戏，需要管理员权限',
  })
  async addGame(@Body() body: CreateGameDto) {
    return await this.gamesService.addGame(body);
  }

  @Get('/getServerInfo')
  async getServerInfo() {
    return await this.gamesService.getServerInfo();
  }

  @Get('/playRoom/:gameId')
  async playGameRoom(@Param('gameId') gameId: string) {
    return await this.gamesService.getGameRoomById(gameId);
  }

  @Get('/play/result/:gameId')
  playResult() {
    return this.gamesService.playResult();
  }

  @Get('/:id')
  async getGame(@Param('id') gameId: number) {
    return await this.gamesService.getGameById(gameId);
  }
}
