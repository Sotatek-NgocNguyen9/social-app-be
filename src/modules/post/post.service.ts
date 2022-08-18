import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/model/entities/post.entity';
import { PostRepository } from 'src/model/repositories/post.repository';
import { PostEditDto } from './dto/post.edit.dto';
import { PostInfoDto } from './dto/post.info.dto';

@Injectable()
export class PostService {
  constructor(@InjectRepository(PostEntity) private postRepo: PostRepository) {}

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

  async getPostByUser(postId: number, userId: number): Promise<PostEntity> {
    const post = await this.getPostById(postId);
    if (post.user_.userId === userId || post.secure === 'public') {
      return post;
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'YOU_CANOT_SEE_THIS_POST',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
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

  async getFeeds({
    userId,
    page = 1,
    pageSize = 5,
  }: {
    userId: number;
    page: number;
    pageSize: number;
  }): Promise<PostEntity[]> {
    this.validatePagi(page, pageSize);
    const posts = await this.postRepo.find({
      where: {},
      order: {
        createDate: 'DESC',
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
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
      .take(pageSize)
      .skip((page - 1) * pageSize)
      .orderBy('createDate', 'DESC')
      .getMany();
    console.log(posts);
    return posts;
  }
}
