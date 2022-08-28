import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthenticationService } from './auth.service';
import { AuthenticationController } from './auth.controller';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../model/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../model/entities/user.entity';
import { UserService } from '../user/user.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { FriendEntity } from 'src/model/entities/friend.entity';

@Module({
  imports: [
    UserModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity, FriendEntity]),
    HttpModule,
  ],
  providers: [
    AuthenticationService,
    LocalStrategy,
    UserRepository,
    UserService,
    JwtService,
    JwtStrategy,
  ],
  exports: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
