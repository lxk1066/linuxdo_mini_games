import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({
  name: 'invitation_key', // 自定义表名 如果不设置的话Webpack编译的时候会混淆类名导致问题
})
export class InvitationKey {
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @Column({ comment: '邀请码', unique: true })
  key: string;

  @Column({ comment: '是否使用', default: false })
  used: boolean;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    comment: '创建时间',
  })
  createTime: Date;
}
