export class Player {
  id: number;
  score: number;
  matchTime: number; // 开始匹配时间
  compositeScore: number; // 综合分数

  constructor(id: number, score: number, matchTime: number) {
    this.id = id;
    this.score = score;
    this.matchTime = matchTime;
    this.compositeScore = this.calculateCompositeScore();
  }

  calculateCompositeScore(): number {
    return this.matchTime;
  }
}
