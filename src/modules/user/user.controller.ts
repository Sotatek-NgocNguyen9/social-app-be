import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { UserAccountDto } from '../auth/dto/user-account.dto';
import { AuthenticationService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserInfoDto } from './dto/user-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SharpPipe } from './sharp-pipe';
import { MessageDto } from './dto/message.dto';
import { UserEmailConfirmDto } from './dto/user-email-confirm.dto';
import { PasswordDto } from './dto/password.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getMe(@Request() req): Promise<UserInfoDto> {
    const data = this.userService.getUserById(req.user.userId);
    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-user-by-id/')
  async getPostById(@Query('userId') userId): Promise<UserInfoDto> {
    return await this.userService.getUserById(userId);
  }

  @Post('/sign-up')
  async register(@Body() userAccount: UserAccountDto) {
    const user = await this.userService.createUser(userAccount);
    this.userService.sendEmail({
      username: user.username,
      userId: user.userId,
    });
    const { password, ...data } = user;
    return data;
  }

  @Post('/resend-confirm-email')
  async resendConfirmEmail(
    @Body() userEmail: UserEmailConfirmDto,
  ): Promise<MessageDto> {
    const message = this.userService.resendEmailRegis(userEmail);
    return message;
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  async uploadImage(
    @UploadedFile(SharpPipe) imageName: string,
    @Body() userInfo: UserInfoDto,
    @Request() req,
  ): Promise<any> {
    if (imageName) {
      await this.userService.sendResizeImage(imageName);
    }
    const userProfile = this.userService.updateUserProfile(
      req.user.userId,
      userInfo,
      imageName,
    );
    return userProfile;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/reset-password')
  async changePassword(
    @Request() req,
    @Body() passwordOb: PasswordDto,
  ): Promise<UserInfoDto> {
    const user = this.userService.resetPassword(req.user.userId, passwordOb);
    return user;
  }
}
