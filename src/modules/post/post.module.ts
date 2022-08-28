import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from '../../model/entities/comment.entity';
import { FriendEntity } from '../../model/entities/friend.entity';
import { PostEntity } from '../../model/entities/post.entity';
import { UserEntity } from '../../model/entities/user.entity';
import { PostRepository } from '../../model/repositories/post.repository';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      UserEntity,
      FriendEntity,
      CommentEntity,
    ]),
  ],
  exports: [PostService],
  controllers: [PostController],
  providers: [JwtService, JwtStrategy, PostService, PostRepository],
})
export class PostModule {}
