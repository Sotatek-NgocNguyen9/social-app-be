import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendEntity } from 'src/model/entities/friend.entity';
import { PostEntity } from 'src/model/entities/post.entity';
import { UserEntity } from 'src/model/entities/user.entity';
import { FriendRepository } from 'src/model/repositories/friend.repository';
import { PostRepository } from 'src/model/repositories/post.repository';
import { UserRepository } from 'src/model/repositories/user.repository';
import { PostEditDto } from './dto/post.edit.dto';
import { PostInfoDto } from './dto/post.info.dto';
import { PostRawInfoDto } from './dto/post.raw.info.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity) private postRepo: PostRepository,
    @InjectRepository(UserEntity) private userRepo: UserRepository,
    @InjectRepository(FriendEntity) private friendRepo: FriendRepository,
  ) {}

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

  async getRawPostById(
    userId: number,
    postId: number,
  ): Promise<PostRawInfoDto> {
    if (postId < 0 || !postId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'INVALID_POSTID_PAYLOAD',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const post = await this.postRepo
      .createQueryBuilder('pe')
      .innerJoin(UserEntity, 'ue', 'pe.user_userId = ue.userId')
      .innerJoin(
        FriendEntity,
        'fe',
        'fe.user_userId = ue.userId OR fe.friend_userId = ue.userId',
      )
      .where(
        '(pe.postId= :postId) AND (pe.user_userId = :userId OR fe.user_userId = :userId OR fe.friend_userId = :userId) AND (pe.secure = "public" OR pe.secure = "friend")',
        {
          postId: postId,
          userId: userId,
        },
      )
      .select([
        'pe.postId as postId',
        'pe.secure as secure',
        'pe.media as media',
        'pe.createDate as createDate',
        'pe.content as content',
        'pe.user_userId as userId',
        'ue.name as name',
        'ue.profileImage as profileImage',
        'ue.username as username',
      ])
      .orderBy('pe.createDate', 'DESC')
      .getRawOne();
    if (post) {
      return post;
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CAN_NOT_FOUND_POST',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getPostById(postId: number): Promise<PostEntity> {
    const post = await this.postRepo.findOne({
      where: {
        postId: postId,
      },
    });
    if (!post) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'POST_NOT_FOUND',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return post;
  }

  validatePost(imageName: string, content: string) {
    if (!imageName && !content) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'BOTH_IMAGE_AND_CONTENT_SHOULD_NOT_EMPTY',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async createPost(
    postInfo: PostInfoDto,
    imageName: string,
    userId: number,
  ): Promise<PostEntity> {
    this.validatePost(imageName, postInfo.content);
    const newPost = this.postRepo.create({
      user_: { userId: userId },
      media: imageName,
      content: postInfo.content,
      secure: this.validateSecure(postInfo.secure),
    });
    const post = await this.postRepo.save(newPost).catch((err: any) => {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'BAD_REQUEST',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
    return post;
  }

  async getFeeds(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<PostRawInfoDto[]> {
    await this.validatePagi(page, pageSize);
    const posts = await this.postRepo
      .createQueryBuilder('pe')
      .innerJoin(UserEntity, 'ue', 'pe.user_userId = ue.userId')
      .innerJoin(
        FriendEntity,
        'fe',
        'fe.user_userId = ue.userId OR fe.friend_userId = ue.userId',
      )
      .where(
        '(pe.user_userId = :userId OR fe.user_userId = :userId OR fe.friend_userId = :userId) AND (pe.secure = "public" OR pe.secure = "friend")',
        {
          userId: userId,
        },
      )
      .select([
        'pe.postId as postId',
        'pe.secure as secure',
        'pe.media as media',
        'pe.createDate as createDate',
        'pe.content as content',
        'pe.user_userId as userId',
        'ue.name as name',
        'ue.profileImage as profileImage',
        'ue.username as username',
      ])
      .orderBy('pe.createDate', 'DESC')
      .offset(page)
      .limit(pageSize)
      .getRawMany();
    return posts;
  }

  validateSecure(secure: string): string {
    if (secure === 'only-me' || secure === 'friend' || secure === 'public') {
      return secure;
    } else {
      return 'friend';
    }
  }

  validateContent(content: string) {
    if (content.length > 200) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CONTENT_TOO_LONG',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  async updatePost(
    postEdit: PostEditDto,
    imageName: string,
    userId: number,
  ): Promise<PostEntity> {
    const post = await this.getPostById(postEdit.postId);
    if (userId !== post.postId) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'USER_NOT_OWN_THIS_POST',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.validateContent(post.content);
    post.content =
      postEdit.content === undefined ? post.content : postEdit.content;
    post.secure = postEdit.secure
      ? this.validateSecure(postEdit.secure)
      : post.secure;
    post.media = imageName ? imageName : post.media;
    await this.postRepo.save(post).catch((err) => {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'CAN_NOT_UPDATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
    return post;
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.getPostById(postId);
    if (userId !== post.user_.userId) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'CANOT_DELETE_THIS_POST',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      await this.postRepo.remove(post);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'CANOT_DELETE_THIS_POST',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getAllPostOfUser(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<PostEntity[]> {
    this.validatePagi(page, pageSize);
    const posts = await this.postRepo
      .createQueryBuilder('post_entity')
      .where('post_entity.user_userId = :id', { id: String(userId) })
      .orderBy('createDate', 'DESC')
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .getMany();
    return posts;
  }
}
