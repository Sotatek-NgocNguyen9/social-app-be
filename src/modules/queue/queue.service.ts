import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { EmailConfirmDto } from './dto/email-confim.dto';
import { QUEUE_NAME, QUEUE_TOPIC } from './queue.enum';
import * as sharp from 'sharp';
import * as path from 'path';
import { join } from 'path';
import { ImageNameDto } from './dto/image-name.dto';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAME.EMAIL) private queueEmail: Queue,
    @InjectQueue(QUEUE_NAME.IMAGE) private queueImage: Queue,
    @InjectQueue(QUEUE_NAME.FORGOT_PASSWORD_EMAIL)
    private queueForgotPasEmail: Queue,
  ) {}

  async sendMailToQueue(emailCF: EmailConfirmDto) {
    await this.queueEmail.add(QUEUE_TOPIC.EMAIL_SEND, emailCF);
  }

  async sendImageToQueue(image: ImageNameDto) {
    await this.queueImage.add(QUEUE_TOPIC.IMAGE_RESIZE, image);
  }

  async sendForgotPasMailToQueue(forgotPasEmail: EmailConfirmDto) {
    await this.queueForgotPasEmail.add(
      QUEUE_TOPIC.FORGOT_PASSWORD_EMAIL_SEND,
      forgotPasEmail,
    );
  }

  async resizeImage(image: ImageNameDto) {
    const { imageName } = image;
    try {
      await sharp(join(process.cwd(), `uploads/profileimages/${imageName}`))
        .resize(800)
        .webp({ effort: 3 })
        .toFile(path.join('uploads/profileimages', `800x${imageName}`));
      await sharp(join(process.cwd(), `uploads/profileimages/${imageName}`))
        .resize(400)
        .webp({ effort: 3 })
        .toFile(path.join('uploads/profileimages', `400x${imageName}`));
      await sharp(join(process.cwd(), `uploads/profileimages/${imageName}`))
        .resize(200)
        .webp({ effort: 3 })
        .toFile(path.join('uploads/profileimages', `200x${imageName}`));
      await sharp(join(process.cwd(), `uploads/profileimages/${imageName}`))
        .resize(200)
        .webp({ effort: 3 })
        .toFile(path.join('uploads/profileimages', `200x${imageName}`));
    } catch (err) {}
    return;
  }
}
