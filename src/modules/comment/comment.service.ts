import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from '../../model/entities/comment.entity';
import { PostEntity } from '../../model/entities/post.entity';
import { UserEntity } from '../../model/entities/user.entity';
import { CommentRepository } from '../../model/repositories/comment.repositoty';
import { PostRepository } from '../../model/repositories/post.repository';
import { UserRepository } from '../../model/repositories/user.repository';
import { PostService } from '../post/post.service';
import { CommentRawInfoDto } from './dto/comment.raw.info.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: UserRepository,
    @InjectRepository(CommentEntity) private commentRepo: CommentRepository,
    @InjectRepository(PostEntity) private postRepo: PostRepository,
    private readonly postService: PostService,
  ) {}

  validatePostId(postId: number) {
    if (postId > 0) {
      return;
    }
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'INVALID_POST_ID',
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async validatePagi(page: number, pageSize: number): Promise<void> {
    if (page > 0 && pageSize > 0) {
      return;
    }
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'INVALID_PAGE_OR_PAGESIZE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async getCommentOfPost(
    userId: number,
    postId: number,
    page: number,
    pageSize: number,
  ): Promise<CommentRawInfoDto[]> {
    console.log(page, pageSize);
    this.validatePagi(page, pageSize);
    await this.postService.getRawPostById(userId, postId);
    const comments = await this.userRepo
      .createQueryBuilder('ue')
      .innerJoin(CommentEntity, 'ce', 'ce.user_userId = ue.userId')
      .innerJoin(PostEntity, 'pe', 'pe.postId = ce.post_postId')
      .where('pe.postId = :postId', { postId: postId })
      .select([
        'ue.userId as userId',
        'ue.name as name',
        'ue.username as username',
        'ue.profileImage as profileImage',
        'pe.postId as postId',
        'ce.commentId as commentId',
        'ce.text as text',
        'ce.createDate as createDate',
      ])
      .orderBy('ce.createDate', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();
    console.log(comments);
    return comments;
  }

  async postComment(
    userId: number,
    postId: number,
    text: string,
  ): Promise<void> {
    if (!text) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'TEXT_CANOT_EMPTY',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.postService.getRawPostById(userId, postId);
    await this.commentRepo
      .createQueryBuilder()
      .insert()
      .into(CommentEntity)
      .values([
        { post_: { postId: postId }, user_: { userId: userId }, text: text },
      ])
      .execute();
    return;
  }
}
