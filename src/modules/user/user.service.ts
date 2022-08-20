import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: UserRepository,
    private readonly httpService: HttpService,
  ) {}

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
}
