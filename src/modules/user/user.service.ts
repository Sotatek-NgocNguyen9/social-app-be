import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../model/entities/user.entity';
import { UserRepository } from '../../model/repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { HttpException } from '@nestjs/common';
import { UserAccountDto } from '../auth/dto/user-account.dto';
import { HttpStatus } from '@nestjs/common';
import { UserInfoDto } from './dto/user-info.dto';
import { HttpService } from '@nestjs/axios';
import { UserInfoUpdateDto } from './dto/user-info-update.dto';
import { MessageDto } from './dto/message.dto';
import { UserEmailConfirmDto } from './dto/user-email-confirm.dto';
import { EmailConfirmDto } from '../queue/dto/email-confim.dto';
import { PasswordDto } from './dto/password.dto';
import { FriendEntity } from 'src/model/entities/friend.entity';
import { FriendRepository } from 'src/model/repositories/friend.repository';
import { UserSearchRawDto } from './dto/user.serach.raw.dto';
import { FriendRequestEntity } from 'src/model/entities/friend-request.entity';
import { UserRawInfoDto } from './dto/user.raw.info.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: UserRepository,
    @InjectRepository(FriendEntity) private friendRepo: FriendRepository,
    private readonly httpService: HttpService,
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
  }

  validateEmail(email: string) {
    if (!email) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'MISSING_EMAIL',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    const check = String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (!check) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'INVALID_EMAIL',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  validatePassword(password: string) {
    if (!password) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'MISSING_PASSWORD',
        },
        HttpStatus.FORBIDDEN,
      );
    } else if (password.length < 6) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'PASSWORD_TOO_SHORT',
        },
        HttpStatus.FORBIDDEN,
      );
    } else if (password.length > 50) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'PASSWORD_TOO_LARGE',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getUserById(userId: number): Promise<UserInfoDto> {
    const user = await this.userRepo.findOne({
      where: {
        userId: userId,
      },
    });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'NOT_FOUND_USER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const { password, ...data } = user;
    return data;
  }

  async getRawUserById(
    userId: number,
    strangerId: number,
  ): Promise<UserRawInfoDto> {
    if (!strangerId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'EMPTY_USERID_PAYLOAD',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const firstJoin = `(ue.userId = fe.user_userId OR ue.userId = fe.friend_userId) 
      AND ((fe.user_userId = ${userId} AND fe.friend_userId = ${strangerId}) OR (fe.friend_userId = ${userId} AND fe.user_userId = ${strangerId}))`;
    const secondJoin = `(ue.userId = fre.user_userId OR ue.userId = fre.requester_userId)
    AND ((fre.user_userId = ${userId} AND fre.requester_userId = ${strangerId}) OR (fre.requester_userId = ${userId} AND fre.user_userId = ${strangerId}))`;
    const user = await this.userRepo
      .createQueryBuilder('ue')
      .leftJoin(FriendEntity, 'fe', firstJoin)
      .leftJoin(FriendRequestEntity, 'fre', secondJoin)
      .where(`ue.userId = ${strangerId}`)
      .select([
        'ue.userId as userId',
        'ue.name as name',
        'ue.username as username',
        'ue.location as location',
        'ue.bio as bio',
        'ue.facebook as facebook',
        'ue.instagram as instagram',
        'ue.linkedin as linkedin',
        'ue.profileImage as profileImage',
        'ue.isActivate as isActivate',
        'fe.user_userId as friendId1',
        'fe.friend_userId as friendId2',
        'fre.user_userId as receiver',
        'fre.requester_userId as requesterId',
      ])
      .getRawOne();
    let relation = 'stranger';
    if (user) {
      if (user.friendId1 && user.friendId2) {
        relation = 'friend';
      } else if (user.receiver == userId) {
        relation = 'requester';
      } else if (user.receiver == strangerId) {
        relation = 'requesting';
      } else if (userId == strangerId) {
        relation = 'myself';
      }
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'USER_NOT_FOUND',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const { friendId1, friendId2, receiver, requesterId, ...data } = user;
    return { ...data, relation: relation };
  }

  async getUserUpdateById(userId: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: {
        userId: userId,
      },
    });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'NOT_FOUND_USER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: {
        username: username,
      },
    });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'NOT_FOUND_USER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async sendEmail(emailCF: EmailConfirmDto): Promise<void> {
    const url = process.env.BACKEND_BASE_URL + 'queue/send-welcome-email';
    this.httpService.axiosRef.post(url, emailCF);
  }

  async sendResizeImage(imageName: string) {
    const url = process.env.BACKEND_BASE_URL + 'queue/resize-image';
    this.httpService.axiosRef.post(url, { imageName: imageName });
  }

  async resendEmailRegis(
    userEmailCF: UserEmailConfirmDto,
  ): Promise<MessageDto> {
    const { username } = userEmailCF;
    if (username) {
      const user = await this.getUserByUsername(username);
      if (user.isActivate) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'USER_IS_ACTIVATED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.sendEmail({
        username: user.username,
        userId: user.userId,
      });
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'MISSING_USERNAME',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'SEND_MAIL' };
  }

  async createUser(userAccount: UserAccountDto): Promise<UserEntity> {
    this.validateEmail(userAccount.username);
    this.validatePassword(userAccount.password);
    const hashedPassword = await this.hashPassWord(userAccount.password);
    userAccount = { ...userAccount, password: hashedPassword };
    const newUser = this.userRepo.create(userAccount);
    await this.userRepo
      .save(newUser)
      .then((data: UserEntity) => {
        return data;
      })
      .catch((err: any) => {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              error: err.code,
            },
            HttpStatus.FORBIDDEN,
          );
        }
      });
    return newUser;
  }

  async updateUserProfile(
    userId: number,
    userInfoUpdate: UserInfoUpdateDto,
    imageName: string,
  ): Promise<UserInfoDto> {
    const user = await this.getUserUpdateById(userId);
    user.bio = userInfoUpdate.bio;
    user.name = userInfoUpdate.name;
    user.location = userInfoUpdate.location;
    user.facebook = userInfoUpdate.facebook;
    user.instagram = userInfoUpdate.instagram;
    user.linkedin = userInfoUpdate.linkedin;
    user.profileImage = imageName ? imageName : user.profileImage;
    await this.userRepo.save(user).catch((err) => {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CAN_NOT_UPDATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
    const data = await this.getUserById(userId);
    return data;
  }

  async activateUser(userId: number) {
    const user = await this.getUserUpdateById(userId);
    user.isActivate = true;
    await this.userRepo.save(user).catch((err) => {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CAN_NOT_UPDATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
    const data = await this.getUserById(userId);
    return data;
  }

  async hashPassWord(rawPass: string): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      bcrypt.hash(
        rawPass,
        parseInt(process.env.PASSWORD_SALT_HASH),
        function (err, hash) {
          if (err) {
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'INTERNAL_SERVER_ERROR',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          resolve(hash);
        },
      );
    });
  }

  async resetPassword(userId: number, passwordOb: PasswordDto) {
    this.validatePassword(passwordOb.password);
    const user = await this.getUserUpdateById(userId);
    user.password = await this.hashPassWord(passwordOb.password);
    await this.userRepo.save(user).catch((err) => {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CAN_NOT_UPDATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
    const data = await this.getUserById(userId);
    return data;
  }

  async fullTextSearchPeople(
    userId: number,
    searchQuery: string,
    page: number,
    pageSize: number,
  ): Promise<UserSearchRawDto[]> {
    if (!searchQuery) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'EMPTY_SEARCH_QUERY_PAYLOAD',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.validatePagi(page, pageSize);
    const firstJoin = `(ue.userId = fe.user_userId OR ue.userId = fe.friend_userId) AND (fe.user_userId != ${userId} AND fe.friend_userId != ${userId})`;
    const secondJoin = `(fe2.user_userId = fe.user_userId OR fe2.user_userId = fe.friend_userId OR fe2.friend_userId = fe.friend_userId OR fe2.friend_userId = fe.user_userId) AND (fe2.user_userId = ${userId} OR fe2.friend_userId = ${userId}) 
                          AND NOT((ue.userId = fe.user_userId AND ue.userId = fe2.user_userId) OR (ue.userId = fe.friend_userId AND ue.userId = fe2.friend_userId) OR (ue.userId = fe.user_userId AND ue.userId = fe2.friend_userId) OR (ue.userId = fe.friend_userId AND ue.userId = fe2.user_userId))`;
    const peoples = await this.userRepo
      .createQueryBuilder('ue')
      .leftJoin(FriendEntity, 'fe', firstJoin)
      .leftJoin(FriendEntity, 'fe2', secondJoin)
      .where(`MATCH(ue.name) AGAINST ('${searchQuery}' IN BOOLEAN MODE)`)
      .orWhere(`MATCH(ue.location) AGAINST ('${searchQuery}' IN BOOLEAN MODE)`)
      .orWhere(`MATCH(ue.bio) AGAINST ('${searchQuery}' IN BOOLEAN MODE)`)
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
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .getRawMany();
    return peoples;
  }
}
