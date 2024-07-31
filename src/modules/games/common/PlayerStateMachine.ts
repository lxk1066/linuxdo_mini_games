type State =
  | 'Waiting'
  | 'Matching'
  | 'Matched'
  | 'Ready'
  | 'InGame'
  | 'Finished'
  | 'Disconnected';

// 玩家状态机
export default class PlayerStateMachine {
  private playerId: number;
  private state: State;
  constructor(playerId: number) {
    this.playerId = playerId;
    this.state = 'Waiting';
  }

  joinMatch() {
    if (this.state === 'Waiting') {
      this.state = 'Matching';
      return true;
    }
    return false;
  }

  matchFound() {
    if (this.state === 'Matching') {
      this.state = 'Matched';
      return true;
    }
    return false;
  }

  readyUp() {
    if (this.state === 'Matched') {
      this.state = 'Ready';
      return true;
    }
    return false;
  }

  gameStart() {
    if (this.state === 'Ready') {
      this.state = 'InGame';
      return true;
    }
    return false;
  }

  gameEnd() {
    if (this.state === 'InGame') {
      this.state = 'Finished';
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.state !== 'Disconnected') {
      this.state = 'Disconnected';
      return true;
    }
    return false;
  }

  getState() {
    return this.state;
  }
}
