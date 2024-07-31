import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NodemailerService } from './nodemailer.service';
import { ConfigService } from '@nestjs/config';

@Processor('email')
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);
  private readonly nodemailerService = new NodemailerService(
    new ConfigService(),
  );

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @Process('sendEmail')
  async sendEmail(job: Job) {
    this.logger.debug(`Sending email to ${job.data.to}`);
    await this.nodemailerService
      .sendEmail(job.data.subject, job.data.to, job.data.text)
      .then(() => {
        this.logger.debug('邮件发送成功：', job.data.to);
      })
      .catch((err) => {
        this.logger.error('邮件发送失败：', err);
      });
  }
}
