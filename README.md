## 项目介绍
LinuxDo 在线随机匹配小游戏后端项目，使用NestJS + Mysql + Redis实现。

## 必读事项
1. 配置文件 `.env.development` 和 `.env.production` 文件必须至少存在一个。
2. `src/modules/games/games.service.ts`文件的`playerDisconnect`方法用于处理用户掉线时的处理。
   目前代码会根据不同状态分别处理，但是逻辑和正确性还有待验证，如果需要马上运行项目，可以改为以下代码，即用户掉线就会删除当前房间的所有信息：
   ```ts
    this.delUserId(playerId);
    const roomId = yield this.redisClientService.hget(`player:${playerId}`, 'roomId');
    const players = yield this.redisClientService.hmget(roomId, 'player1', 'player2');
    const playerIndex = playerId == players[0] ? 1 : 2;
    await this.redisClientService.hmset(roomId, {
        state: 'playAbort',
        player1Score: playerIndex == 1 ? '-1' : undefined,
        player2Score: playerIndex == 2 ? '-1' : undefined,
    });
    this.redisClientService.del(`player:${playerId}`);
    this.redisClientService.zrem('matching', `player:${playerId}`);
    this.redisClientService.del(roomId);
    return `playerDisconnect`;
   ```
3. 本项目有两种打包模式：NestJS打包和Webpack打包。NestJS打包会生产出一个文件夹项目，并且包含源码，而Webpack打包会生成两个文件：一个是webpack打包后的原始JS文件；一个是经过第三方库加密的独立JS文件，**需要注意的是**: webpack配置文件中配置了第三方加密插件，尽量不要改动，我已经经过测试可以正常使用，如果对加密插件进行额外修改可能造成系统无法运行（过度的混淆加密会破坏NestJS运行）。
   ```json
    // package.json
    "scripts": {
      "build": "nest build",
      "build:wp": "nest build --webpack --webpackPath webpack.config.js",
    }
   ```

   webpack打包模式比较适合分发打包后的产物而不需要担心暴露源码。

4. 系统登录需要通过[ LinuxDo 开发者应用接入](https://connect.linux.do)后，通过Oauth登录，也可以自己再开发一套注册登录接口(已提供基础接口)。这里对如何接入LinuxDo做出说明。
   
  LinuxDo默认提供的测试应用配置如下：
  + authorize 端点： https://connect.linux.do/oauth2/authorize
  + token 端点：https://connect.linux.do/oauth2/token
  + 用户信息 端点：https://connect.linux.do/api/user
  + client_id: hi3geJYfTotoiR5S62u3rh4W5tSeC5UG
  + client_secret: VMPBVoAfOB5ojkGXRDEtzvDhRLENHpaN
  + redirect_uri: http://localhost:8181/oauth2/callback

  在`.env.development`和`.env.production`环境配置文件中填写以上配置，注意：如果使用LinuxDo提供的测试应用，需要将后端的端口改成8181，这样才能成功跳转回来。

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
