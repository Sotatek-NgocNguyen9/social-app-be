import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from '../../model/entities/comment.entity';
import { FriendEntity } from '../../model/entities/friend.entity';
import { PostEntity } from '../../model/entities/post.entity';
import { UserEntity } from '../../model/entities/user.entity';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { PostModule } from '../post/post.module';
import { PostService } from '../post/post.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PostEntity,
      CommentEntity,
      FriendEntity,
    ]),
    PostModule,
  ],
  exports: [],
  controllers: [CommentController],
  providers: [JwtService, JwtStrategy, CommentService, PostService],
})
export class CommentModule {}
