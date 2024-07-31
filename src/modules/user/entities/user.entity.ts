import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'user', // 自定义表名 如果不设置的话Webpack编译的时候会混淆类名导致问题
})
export class User {
  @PrimaryColumn({ comment: '用户ID', unique: true })
  id: number;

  // linuxdo or register or admin
  @Column({ comment: '用户类型', default: 'linuxdo' })
  userType: string;

  @Column({ comment: '头像', default: 'default.png' })
  avatar: string;

  @Column({ comment: '用户名' })
  username: string;

  @Column({ comment: '昵称' })
  nickname: string;

  @Column({ comment: '邮箱', length: 100, unique: true })
  email: string;

  @Column({ comment: '用户等级' })
  trustLevel: number;

  @Column({ comment: '分数', default: 0 })
  score: number;

  @Column({ comment: '密码', select: false, default: '' })
  password: string;

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

  // 两种特殊类型: simple-array、 simple-json

  // simple-array 可以存储一个简单的数组，内部会帮我们用split和join进行处理，
  //                因此在设置该列的值时，需要避免字符串中出现英文逗号
  // @Column('simple-array')
  // role: Array<'admin' | 'user' | 'guest'>;

  // simple-json 可以存储一个简单的json对象，内部会帮我们用JSON.stringify和JSON.parse进行处理
  // @Column('simple-json')
  // info: {
  //   email: string;
  //   phone: string;
  // };
}
