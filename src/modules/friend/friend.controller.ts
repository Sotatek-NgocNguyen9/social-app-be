import { Controller, Post, Request, Body, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { MessageDto } from '../user/dto/message.dto';
import { FriendAcceptDto } from './dto/friend.accept.dto';
import { FriendSendReqDto } from './dto/friend.sendReq.dto';
import { FriendService } from './friend.service';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/send-friend-request')
  async sendFriendRequest(
    @Request() req,
    @Body() sendFriendReq: FriendSendReqDto,
  ): Promise<MessageDto> {
    await this.friendService.sendFriendRequest(req.user.userId, sendFriendReq);
    return {
      message: 'SEND_FRIEND_REQUEST_SUCCESS',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/accept-friend-request')
  async acceptFriendRequest(
    @Request() req,
    @Body() friendAccept: FriendAcceptDto,
  ): Promise<MessageDto> {
    return {
      message: 'ACCEPT_FRIEND_REQUEST_SUCCESS',
    };
  }
}
