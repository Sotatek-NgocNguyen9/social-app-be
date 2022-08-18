import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { FriendRequestEntity } from 'src/model/entities/friend-request.entity';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { FriendEntity } from 'src/model/entities/friend.entity';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendEntity, FriendRequestEntity, UserEntity]),
    HttpModule,
    UserModule,
  ],
  exports: [],
  controllers: [FriendController],
  providers: [JwtService, JwtStrategy, FriendService, UserService],
})
export class FriendModule {}
