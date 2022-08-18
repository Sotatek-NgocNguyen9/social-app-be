import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueController } from './queue.controller';
import { QUEUE_NAME } from './queue.enum';
import { QueueService } from './queue.service';
import {
  QueueForgotPasEmailProcessor,
  QueueImageProcessor,
} from './queue.processor';
import { QueueEmailProcessor } from './queue.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAME.EMAIL,
      },
      {
        name: QUEUE_NAME.IMAGE,
      },
      {
        name: QUEUE_NAME.FORGOT_PASSWORD_EMAIL,
      },
    ),
  ],
  exports: [],
  providers: [
    QueueEmailProcessor,
    QueueImageProcessor,
    QueueService,
    QueueForgotPasEmailProcessor,
  ],
  controllers: [QueueController],
})
export class QueueModule {}
