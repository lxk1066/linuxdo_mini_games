import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  sendEmail(subject: string, to: string, text: string) {
    this.emailQueue.add('sendEmail', { subject, to, text }, { delay: 1000 });
  }
}
