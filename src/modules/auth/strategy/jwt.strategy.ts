import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Request } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: String(process.env.JWT_ACCESS_TOKEN_SECRET),
    });
  }

  async validate(payload: any) {
    return { userId: payload.userId, username: payload.username };
  }

  private static extractJWT(@Request() req): string | null {
    if (
      req.cookies &&
      'access_token' in req.cookies &&
      req.cookies['access_token'].length > 0
    ) {
      return req.cookies['access_token'];
    }
    return null;
  }
}
