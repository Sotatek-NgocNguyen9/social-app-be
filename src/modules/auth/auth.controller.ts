import {
  Post,
  Controller,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Request,
  Body,
  Res,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import { LocalAuthGuard } from './guard/local.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password';
import { MessageDto } from '../user/dto/message.dto';
import { SeceretTokenDto } from './dto/secret_token.dto';
import { UserInfoDto } from '../user/dto/user-info.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Res({ passthrough: true }) response,
  ): Promise<UserInfoDto> {
    const tokenAccess = await this.authenticationService.login(req.user);
    await this.authenticationService.createRefreshToken(tokenAccess, req.user);
    response.cookie('access_token', tokenAccess.access_token, {
      httpOnly: true,
      expires: new Date(Date.now() + 900000),
      secure: true,
      sameSite: 'none',
    });
    const user = await this.authenticationService.getUserById(req.user.userId);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) response) {
    if (req.cookies['access_token']) {
      response.clearCookie('access_token');
    }
    // phai tim xem co nhieu nguoi log vao khong
    await this.authenticationService.deleteRefreshToken(
      req.cookies['access_token'],
    );
    return { message: 'LOGOUT_SUCCESS' };
  }

  @Post('confirm-email')
  async confirmEmail(
    @Body() secretTokenOb: SeceretTokenDto,
    @Res({ passthrough: true }) response,
  ): Promise<UserInfoDto> {
    const user = await this.authenticationService.validateSecretToken(
      secretTokenOb.secretToken,
    );
    const tokenAccess = await this.authenticationService.login(user);
    await this.authenticationService.createRefreshToken(tokenAccess, user);
    response.cookie('access_token', tokenAccess.access_token, {
      httpOnly: true,
      expires: new Date(Date.now() + 900000),
      secure: true,
      sameSite: 'none',
    });
    return user;
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPas: ForgotPasswordDto,
  ): Promise<MessageDto> {
    const response = await this.authenticationService.forgotPassword(forgotPas);
    return response;
  }

  @Post('confirm-reset-password')
  async resetPassword(
    @Body() secretTokenOb: SeceretTokenDto,
    @Res({ passthrough: true }) response,
  ): Promise<UserInfoDto> {
    const user = await this.authenticationService.validateSecretToken(
      secretTokenOb.secretToken,
    );
    const tokenAccess = await this.authenticationService.login(user);
    await this.authenticationService.createRefreshToken(tokenAccess, user);
    response.cookie('access_token', tokenAccess.access_token, {
      httpOnly: true,
      expires: new Date(Date.now() + 900000),
      secure: true,
      sameSite: 'none',
    });
    return user;
  }

  @Get('generate-access-token')
  async getAccessToken(
    @Request() req,
    @Res({ passthrough: true }) response,
  ): Promise<UserInfoDto> {
    if (req.cookies['access_token']) {
      const createToken = await this.authenticationService.createAccessToken(
        String(req.cookies['access_token']),
      );
      response.cookie('access_token', createToken.access_token, {
        httpOnly: true,
        expires: new Date(Date.now() + 900000),
        secure: true,
        sameSite: 'none',
      });
      return createToken.user;
    } else {
      throw new UnauthorizedException();
    }
  }
}
