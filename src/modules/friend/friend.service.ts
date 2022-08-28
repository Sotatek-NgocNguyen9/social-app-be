import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FriendEntity } from 'src/model/entities/friend.entity';
import { FriendRepository } from 'src/model/repositories/friend.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendRequestEntity } from 'src/model/entities/friend-request.entity';
import { FriendRequestRepository } from 'src/model/repositories/friend-request.repository';
import { UserService } from '../user/user.service';
import { FriendSendReqDto } from './dto/friend.sendReq.dto';
import { FriendAcceptDto } from './dto/friend.accept.dto';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import { FriendDeleteRequestDto } from './dto/friend.deleteReq.dto';
import { FriendExploreDto } from './dto/friend.explore.dto';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendEntity) private friendRepo: FriendRepository,
    @InjectRepository(UserEntity) private userRepo: UserRepository,
    @InjectRepository(FriendRequestEntity)
    private friendReqRepo: FriendRequestRepository,
    private readonly userService: UserService,
  ) {}

  validatePagi(page: number, pageSize: number) {
    if (page < 0 || pageSize < 0 || !page || !pageSize) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'INVALID_PAGE_OR_PAGESIZE',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async checkRequest(userId: number, strangerId: number): Promise<boolean> {
    const isRequest = await this.friendReqRepo
      .createQueryBuilder('friend_request_entity')
      .where('(user_userId= :userId AND requester_userId= :strangerId)', {
        userId: userId,
        strangerId: strangerId,
      })
      .getOne();
    return isRequest ? true : false;
  }

  async checkFriendRequest(userId: number, strangerId: number): Promise<void> {
    if (await this.checkRequest(userId, strangerId)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'THIS_USER_SENT_REQUEST_FOR_YOU',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (await this.checkRequest(strangerId, userId)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'YOU_SENT_REQUEST_TO_THIS_USER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async checkFriend(userId: number, strangerId: number): Promise<boolean> {
    const isFriend = await this.friendRepo
      .createQueryBuilder('friend_entity')
      .where(
        '(user_userId= :userId AND friend_userId= :strangerId) OR (user_userId= :strangerId AND friend_userId= :userId)',
        {
          userId: userId,
          strangerId: strangerId,
        },
      )
      .getOne();
    return isFriend ? true : false;
  }

  async sendFriendRequest(userId: number, sendFriendReq: FriendSendReqDto) {
    const strangerId = parseInt(String(sendFriendReq.strangerId));
    if (!strangerId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'EMPTY_STRANGER_PAYLOAD',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (userId === strangerId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'YOU_CAN_NOT_SEND_REQUEST_YOURSELF',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userService.getUserById(strangerId); //kiem tra nguoi duoc gui yeu cau co ton tai khong
    const checkIsFriend = await this.checkFriend(userId, strangerId);
    await this.checkFriendRequest(userId, strangerId);
    if (!checkIsFriend) {
      // put data to db
      await this.friendReqRepo
        .createQueryBuilder()
        .insert()
        .into(FriendRequestEntity)
        .values([
          { user_: { userId: strangerId }, requester_: { userId: userId } },
        ])
        .execute();
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'BOTH_USER_ARE_FRIEND',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async deleteFriendRequest(
    userId: number,
    deleteFriendRequest: FriendDeleteRequestDto,
  ): Promise<void> {
    const requesterId = parseInt(String(deleteFriendRequest.requesterId));
    if (!requesterId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'EMPTY_REQUESTER_PAYLOAD',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (await this.checkRequest(userId, requesterId)) {
      // delete the request
      await this.friendReqRepo
        .createQueryBuilder('friend_request_entity')
        .delete()
        .from(FriendRequestEntity)
        .where('requester_userId = :requesterId AND user_userId = :userId', {
          requesterId: requesterId,
          userId: userId,
        })
        .execute();
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'THE_REQUEST_NOT_EXIST',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async acceptFriendRequest(userId: number, friendAccept: FriendAcceptDto) {
    const requesterId = parseInt(String(friendAccept.requesterId));
    if (!requesterId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'EMPTY_REQUESTER_PAYLOAD',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (userId === requesterId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'YOU_CAN_NOT_ACCEPT_REQUEST_YOURSELF',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userService.getUserById(requesterId); //kiem tra nguoi duoc gui yeu cau co ton tai khong
    if (await this.checkFriend(userId, requesterId)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'BOTH_ARE_FRIEND',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (await this.checkRequest(userId, requesterId)) {
      // do accept friend request
      await this.friendRepo
        .createQueryBuilder()
        .insert()
        .into(FriendEntity)
        .values([
          { user_: { userId: userId }, friend_: { userId: requesterId } },
        ])
        .execute();
      await this.friendReqRepo
        .createQueryBuilder()
        .delete()
        .from(FriendRequestEntity)
        .where('(user_userId= :userId AND requester_userId= :requesterId)', {
          userId: userId,
          requesterId: requesterId,
        })
        .execute();
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'THEY_NOT_SENT_REQUEST_YET',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllFriendRequest(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<UserEntity[]> {
    this.validatePagi(page, pageSize);
    const requests = await this.userRepo
      .createQueryBuilder('ue')
      .innerJoin(FriendRequestEntity, 'fe', 'ue.userId = fe.requester_userId')
      .where('fe.user_userId = :userId', {
        userId: userId,
      })
      .select(['ue.userId', 'ue.name', 'ue.profileImage', 'ue.username'])
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .getMany();
    return requests;
  }

  async getAllFriend(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<UserEntity[]> {
    this.validatePagi(page, pageSize);
    const friends = await this.userRepo
      .createQueryBuilder('ue')
      .innerJoin(
        FriendEntity,
        'fe',
        'fe.user_userId = ue.userId OR fe.friend_userId = ue.userId',
      )
      .where(
        'ue.userId != :userId AND (fe.user_userId = userId OR fe.friend_userId = userId)',
        { userId: userId },
      )
      .select(['ue.userId', 'ue.name', 'ue.profileImage', 'ue.username'])
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .getMany();
    return friends;
  }

  async explorePeople(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<FriendExploreDto[]> {
    this.validatePagi(page, pageSize);
    const firstJoin = `(ue.userId = fe.user_userId OR ue.userId = fe.friend_userId) AND (fe.user_userId != ${userId} AND fe.friend_userId != ${userId})`;
    const secondJoin = `(fe2.user_userId = fe.user_userId OR fe2.user_userId = fe.friend_userId OR fe2.friend_userId = fe.friend_userId OR fe2.friend_userId = fe.user_userId) AND (fe2.user_userId = ${userId} OR fe2.friend_userId = ${userId}) 
                          AND NOT((ue.userId = fe.user_userId AND ue.userId = fe2.user_userId) OR (ue.userId = fe.friend_userId AND ue.userId = fe2.friend_userId) OR (ue.userId = fe.user_userId AND ue.userId = fe2.friend_userId) OR (ue.userId = fe.friend_userId AND ue.userId = fe2.user_userId))`;
    const condition = `(NOT EXISTS (SELECT fe3.user_userId, fe3.friend_userId FROM friend_entity fe3 
                            WHERE (
                                (fe3.user_userId = ${userId} AND fe3.user_userId = ue.userId) OR (fe3.friend_userId = ue.userId AND fe3.user_userId = ${userId}) OR
                                (fe3.friend_userId = ${userId} AND fe3.user_userId = ue.userId) OR (fe3.friend_userId = ue.userId AND fe3.friend_userId = ${userId})
                            )
                          )
                        )
                        AND (ue.userId != ${userId})
                        AND (NOT EXISTS (SELECT fre.user_userId, fre.requester_userId FROM friend_request_entity fre
                          WHERE(
                             (fre.user_userId = ${userId} AND fre.user_userId = ue.userId) OR (fre.requester_userId = ue.userId AND fre.user_userId = ${userId}) OR
                             (fre.requester_userId = ${userId} AND fre.user_userId = ue.userId) OR (fre.requester_userId = ue.userId AND fre.requester_userId = ${userId})
                              )            
                       )
                  )`;
    const peoples = await this.userRepo
      .createQueryBuilder('ue')
      .leftJoin(FriendEntity, 'fe', firstJoin)
      .leftJoin(FriendEntity, 'fe2', secondJoin)
      .where(condition)
      .select([
        'COUNT(fe2.user_userId) as mutualFriend',
        'ue.userId as userId',
        'ue.name as name',
        'ue.username as username',
        'ue.profileImage as profileImage',
        'ue.location as location',
      ])
      .groupBy('ue.userId')
      .orderBy('mutualFriend', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();
    return peoples;
  }
}
