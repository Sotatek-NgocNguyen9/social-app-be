import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../model/entities/user.entity';
import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { AccessTokenDto } from './dto/access-token.dto';
import { Cache } from 'cache-manager';
import { UserInfoDto } from '../user/dto/user-info.dto';
import { HttpService } from '@nestjs/axios';
import { ForgotPasswordDto } from './dto/forgot-password';
import { EmailConfirmDto } from '../queue/dto/email-confim.dto';
import { MessageDto } from '../user/dto/message.dto';
import { CreateTokenDto } from './dto/auth.create-token.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async validateUserCredential(
    username: string,
    password: string,
  ): Promise<UserEntity> {
    // username if email form and password > 6 digits
    this.userService.validateEmail(username);
    this.userService.validatePassword(password);
    // get user by username
    const user = await this.userService.getUserByUsername(username);
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return user;
      } else {
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'INVALID_PASSWORD',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'USER_NOT_FOUND',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async login(user: UserInfoDto): Promise<AccessTokenDto> {
    const payload = { username: user.username, userId: user.userId };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: String(process.env.JWT_ACCESS_TOKEN_SECRET),
        expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      }),
    };
  }

  async getUserById(userId: number): Promise<UserInfoDto> {
    return await this.userService.getUserById(userId);
  }

  async validateSecretToken(secretToken: string) {
    const userId = await this.cacheManager.get(secretToken).catch(() => {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'UNAUTHORIZED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    });

    if (!userId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'SECRET_TOKEN_TIMEOUT',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // delete cache
    await this.cacheManager.del(secretToken);
    // get user by id
    const user = await this.userService.activateUser(
      parseInt(userId as string),
    );
    // activate user
    return user;
  }

  async sendForgotPasswordEmail(
    forgotPasEmail: EmailConfirmDto,
  ): Promise<MessageDto> {
    const url = process.env.BACKEND_BASE_URL + 'queue/send-get-password-email';
    await this.httpService.axiosRef.post(url, forgotPasEmail).catch((err) => {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'CANOT_SEND_EMAIL',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
    return { message: 'SEND_MAIL' };
  }

  async forgotPassword(forgotPas: ForgotPasswordDto): Promise<MessageDto> {
    this.userService.validateEmail(forgotPas.username);
    const user = await this.userService.getUserByUsername(forgotPas.username);
    if (!user.isActivate) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'USER_IS_NOT_ACTIVATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.sendForgotPasswordEmail({
      username: user.username,
      userId: user.userId,
    });
    return { message: 'SEND_FORGOT_PASSWORD_EMAIL' };
  }

  async createRefreshToken(tokenAccess: AccessTokenDto, user: UserInfoDto) {
    // check if is first user or not
    // co nguoi dung dang login trong he thong
    const key =
      process.env.REDIST_FEFRESH_TOKEN_KEY_PREFIX + String(user.userId);
    const refresh_token = await this.cacheManager.get(key);

    if (refresh_token) {
      // ton tai nguoi dung trc do
      this.cacheManager.set(tokenAccess.access_token, refresh_token, {
        ttl: parseInt(process.env.REDIS_REFRESH_TOKEN_TTL),
      });
      return;
    } else {
      const payload = { username: user.username, userId: user.userId };
      const refresh_token = this.jwtService.sign(payload, {
        secret: String(process.env.JWT_REFRESH_TOKEN_SECRET),
        expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
      });
      await this.cacheManager.set(key, refresh_token, {
        ttl: parseInt(process.env.REDIS_REFRESH_TOKEN_TTL),
      });
      await this.cacheManager.set(tokenAccess.access_token, refresh_token, {
        ttl: parseInt(process.env.REDIS_REFRESH_TOKEN_TTL),
      });
    }
    return;
  }

  async deleteRefreshToken(access_token: string) {
    await this.cacheManager.del(access_token);
  }

  async createAccessToken(expireAccToken: string): Promise<CreateTokenDto> {
    const refresh_token = await this.cacheManager.get(expireAccToken);
    if (refresh_token) {
      const payload = this.jwtService.decode(String(refresh_token));
      const { iat, exp, ...payloadAcc } = JSON.parse(JSON.stringify(payload));
      await this.cacheManager.del(expireAccToken);
      const access_token = this.jwtService.sign(payloadAcc, {
        secret: String(process.env.JWT_ACCESS_TOKEN_SECRET),
        expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      });
      const user = await this.getUserById(payloadAcc.userId);
      await this.cacheManager.set(access_token, refresh_token);
      return { access_token: access_token, user: user };
    } else {
      throw new UnauthorizedException();
    }
  }
}
