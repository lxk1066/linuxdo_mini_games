export class Player {
  id: number;
  score: number;
  matchTime: number; // 开始匹配时间
  compositeScore: number; // 综合分数
  faultTolerance: number; // 容错值

  constructor(id: number, score: number, matchTime: number) {
    this.id = id;
    this.score = score;
    this.matchTime = matchTime;
    this.compositeScore = this.calculateCompositeScore();
    this.faultTolerance = 100; // 初始容错值
  }

  calculateCompositeScore(): number {
    return this.score * 1.5 + this.matchTime * 1.1;
  }

  updateFaultTolerance(seconds: number): void {
    this.faultTolerance += seconds * 10; // 每10秒增加100
  }
}
