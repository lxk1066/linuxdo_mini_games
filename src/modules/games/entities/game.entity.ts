import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'game',
})
export class Game {
  @PrimaryGeneratedColumn({ comment: '游戏ID' })
  id: number;

  @Column({ comment: '游戏名称' })
  name: string;

  @Column({ comment: '游戏介绍' })
  description: string;

  @Column({ comment: '游戏页面对应的路径' })
  path: string;

  @Column({ comment: '游戏作者', default: 'own' })
  author: string;

  @Column({ comment: '游戏作者的联系方式', default: '' })
  authorContact: string;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    name: 'update_time',
    type: 'timestamp',
    comment: '更新时间',
  })
  updateTime: Date;
}
