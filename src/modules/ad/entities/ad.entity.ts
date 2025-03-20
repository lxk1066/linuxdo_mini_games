import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'advertise', // 自定义表名 如果不设置的话Webpack编译的时候会混淆类名导致问题
})
export class Ad {
  @PrimaryGeneratedColumn({ comment: '广告ID' })
  id: number;

  @Column({ comment: '广告标题' })
  title: string;

  @Column({ comment: '广告介绍' })
  description: string;

  @Column({ comment: '广告对应的链接, 可以为空', nullable: true })
  url: string;

  @Column({ comment: '广告索引，从小到大排列', default: 0 })
  index: number;

  @Column({ comment: '广告内容' })
  content: string;
}
