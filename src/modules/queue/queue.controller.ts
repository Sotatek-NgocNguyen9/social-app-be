import { Body, Controller, Get, Post } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailConfirmDto } from './dto/email-confim.dto';
import { ImageNameDto } from './dto/image-name.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('/send-welcome-email')
  async sendWelcomeMail(@Body() emailCF: EmailConfirmDto) {
    await this.queueService.sendMailToQueue(emailCF);
    return emailCF;
  }

  @Post('/resize-image')
  async resizePhoto(@Body() image: ImageNameDto) {
    await this.queueService.sendImageToQueue(image);
  }

  @Post('/send-get-password-email')
  async sendGetPasMail(@Body() forgotPasEmail: EmailConfirmDto) {
    await this.queueService.sendForgotPasMailToQueue(forgotPasEmail);
    return forgotPasEmail;
  }
}
