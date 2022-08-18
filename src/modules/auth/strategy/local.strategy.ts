import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './../auth.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthenticationService) {
    super();
  }

  @UseGuards(JwtAuthGuard)
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUserCredential(
      username,
      password,
    );
    if (!user) {
      throw new UnauthorizedException();
    } else if (!user.isActivate) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'ACCOUNT_IS_NOT_ACTIVATED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
