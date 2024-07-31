import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class NodemailerService {
  private readonly transporter: Transporter;

  constructor(private configService: ConfigService) {
    // 实例化 nodemailer 连接实例
    this.transporter = createTransport({
      host: configService.get('EMAIL_HOST'),
      port: configService.get('EMAIL_PORT'),
      secure: true, //  安全的发送模式
      auth: {
        user: configService.get('EMAIL_ACCOUNT'), // 发件人邮箱
        pass: configService.get('EMAIL_PASSWORD'), //  授权码
      },
    });
  }

  // 发送邮件
  sendEmail(subject: string, to: string, text: string) {
    const emailForm = this.configService.get('EMAIL_FROM');
    const emailAccount = this.configService.get('EMAIL_ACCOUNT');

    const message = {
      // 发件人邮箱
      from: `(${emailForm})${emailAccount}`,
      // 邮件标题
      subject,
      // 目标邮箱
      to,
      // 邮件内容
      text,
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(message, (err, data) => {
        // console.log("at sendMail...");
        if (err) {
          reject({ err });
        } else {
          resolve({ data });
        }
      });
    });
  }
}
