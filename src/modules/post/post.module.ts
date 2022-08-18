import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/model/entities/post.entity';
import { PostRepository } from 'src/model/repositories/post.repository';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity])],
  exports: [],
  controllers: [PostController],
  providers: [JwtService, JwtStrategy, PostService, PostRepository],
})
export class PostModule {}
