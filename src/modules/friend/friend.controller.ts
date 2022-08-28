import { Controller, Post, Request, Body, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { MessageDto } from '../user/dto/message.dto';
import { UserInfoDto } from '../user/dto/user-info.dto';
import { FriendAcceptDto } from './dto/friend.accept.dto';
import { FriendDeleteRequestDto } from './dto/friend.deleteReq.dto';
import { FriendExploreDto } from './dto/friend.explore.dto';
import { FriendPaginateDto } from './dto/friend.paginate.dto';
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
  @Post('/delete-friend-request')
  async deleteFriendRequest(
    @Request() req,
    @Body() deleteFriendRequest: FriendDeleteRequestDto,
  ): Promise<MessageDto> {
    await this.friendService.deleteFriendRequest(
      req.user.userId,
      deleteFriendRequest,
    );
    return {
      message: 'DELETE_FRIEND_REQUEST_SUCCESS',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/accept-friend-request')
  async acceptFriendRequest(
    @Request() req,
    @Body() friendAccept: FriendAcceptDto,
  ): Promise<MessageDto> {
    await this.friendService.acceptFriendRequest(req.user.userId, friendAccept);
    return {
      message: 'ACCEPT_FRIEND_REQUEST_SUCCESS',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-all-friend-request')
  async getAllFriendRequest(
    @Request() req,
    @Body() friendPaginate: FriendPaginateDto,
  ): Promise<UserInfoDto[]> {
    const page = parseInt(String(friendPaginate.page));
    const pageSize = parseInt(String(friendPaginate.pageSize));
    const requests = await this.friendService.getAllFriendRequest(
      req.user.userId,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-all-friend')
  async getAllFriend(
    @Request() req,
    @Body() friendPaginate: FriendPaginateDto,
  ) {
    const page = parseInt(String(friendPaginate.page));
    const pageSize = parseInt(String(friendPaginate.pageSize));
    const friends = this.friendService.getAllFriend(
      req.user.userId,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
    return friends;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/explore-people')
  async getExplorePeople(
    @Request() req,
    @Body() friendPaginate: FriendPaginateDto,
  ): Promise<FriendExploreDto[]> {
    const page = parseInt(String(friendPaginate.page));
    const pageSize = parseInt(String(friendPaginate.pageSize));
    const people = await this.friendService.explorePeople(
      req.user.userId,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
    return people;
  }
}
