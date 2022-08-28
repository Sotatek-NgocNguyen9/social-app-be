import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/entities/user.entity';
import { UserRepository } from 'src/model/repositories/user.repository';
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { AuthenticationService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { FriendEntity } from 'src/model/entities/friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FriendEntity]), HttpModule],
  exports: [UserService],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    AuthenticationService,
    JwtService,
    JwtStrategy,
  ],
})
export class UserModule {}
