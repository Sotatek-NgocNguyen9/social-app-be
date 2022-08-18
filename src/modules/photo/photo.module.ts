import { Module } from '@nestjs/common';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { JwtStrategy } from './../auth/strategy/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  exports: [],
  controllers: [PhotoController],
  providers: [PhotoService, JwtStrategy],
})
export class PhotoModule {}
