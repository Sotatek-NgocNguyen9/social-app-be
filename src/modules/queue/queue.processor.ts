import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUE_NAME, QUEUE_TOPIC } from './queue.enum';
import { MailerService } from '@nestjs-modules/mailer';
import { QueueService } from './queue.service';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';

@Processor(QUEUE_NAME.EMAIL)
export class QueueEmailProcessor {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Process(QUEUE_TOPIC.EMAIL_SEND)
  async processEmail(jobData: Job) {
    const secretToken = uuidv4();
    await this.cacheManager.set(secretToken, jobData.data.userId, { ttl: 60 });
    const CFpayload = {
      confirmUrl: secretToken,
      username: jobData.data.username,
    };
    await this.mailerService
      .sendMail({
        to: jobData.data.username,
        from: String(process.env.HOST_EMAIL),
        subject: 'Welcome new user',
        template: './email-confirm.hbs',
        context: { CFpayload: CFpayload },
      })
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
    return;
  }
}

@Processor(QUEUE_NAME.IMAGE)
export class QueueImageProcessor {
  constructor(private readonly queueService: QueueService) {}

  @Process(QUEUE_TOPIC.IMAGE_RESIZE)
  async processImage(jobData: Job) {
    await this.queueService.resizeImage(jobData.data);
    return;
  }
}

@Processor(QUEUE_NAME.FORGOT_PASSWORD_EMAIL)
export class QueueForgotPasEmailProcessor {
  constructor(
    private readonly queueService: QueueService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Process(QUEUE_TOPIC.FORGOT_PASSWORD_EMAIL_SEND)
  async processForgotPasEmail(jobData: Job) {
    const secretToken = uuidv4();
    await this.cacheManager.set(secretToken, jobData.data.userId, { ttl: 60 });
    const CFpayload = {
      confirmUrl: secretToken,
      username: jobData.data.username,
    };
    await this.mailerService
      .sendMail({
        to: jobData.data.username,
        from: String(process.env.HOST_EMAIL),
        subject: 'Forgot Password',
        template: './email-forgot-password.hbs',
        context: { CFpayload: CFpayload },
      })
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
    return;
  }
}
