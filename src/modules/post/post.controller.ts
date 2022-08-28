import {
  Post,
  Request,
  Controller,
  UseGuards,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Put,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PostService } from './post.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PostInfoDto } from './dto/post.info.dto';
import { PostEntity } from '../../model/entities/post.entity';
import { PostEditDto } from './dto/post.edit.dto';
import { PostDeleteDto } from './dto/post.delete.dto';
import { MessageDto } from '../user/dto/message.dto';
import { PostPaginateDto } from './dto/post.paginate.dto';
import { PostRawInfoDto } from './dto/post.raw.info.dto';
import { PostGetAllByUserIdDto } from './dto/post.get-all-post-by-user-id.dto';
import { PostSearchDto } from './dto/post.search';

export const storage = {
  storage: diskStorage({
    destination: './uploads/postimages',
    filename: (req, file, cb) => {
      const filename: string =
        Date.now() +
        '-' +
        path.parse(file.originalname).name.replace(/\s/g, '') +
        uuidv4();
      cb(null, `${filename}.webp`);
    },
  }),
};

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/feeds')
  async getFeeds(
    @Request() req,
    @Body() postPaginate: PostPaginateDto,
  ): Promise<PostRawInfoDto[]> {
    const page = parseInt(String(postPaginate.page));
    const pageSize = parseInt(String(postPaginate.pageSize));
    const feeds = await this.postService.getFeeds(
      req.user.userId,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
    return feeds;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-post')
  @UseInterceptors(FileInterceptor('media', storage))
  async createPost(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body() postInfo: PostInfoDto,
  ): Promise<PostEntity> {
    const imageName = file ? file.filename : '';
    const post = await this.postService.createPost(
      postInfo,
      imageName,
      req.user.userId,
    );
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-post-by-id/')
  async getPostById(
    @Query('postId') postId,
    @Request() req,
  ): Promise<PostRawInfoDto> {
    return await this.postService.getRawPostById(
      req.user.userId,
      parseInt(String(postId)),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-post')
  @UseInterceptors(FileInterceptor('media', storage))
  async updatePost(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body() postInfo: PostEditDto,
  ): Promise<PostEntity> {
    const imageName = file ? file.filename : '';
    const post = await this.postService.updatePost(
      postInfo,
      imageName,
      req.user.userId,
    );
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/delete-post')
  async deletePost(
    @Request() req,
    @Body() postDelete: PostDeleteDto,
  ): Promise<MessageDto> {
    await this.postService.deletePost(postDelete.postId, req.user.userId);
    return { message: 'DELETE_POST_SUCCESS' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-all-post-of-user')
  async getAllPostOfUser(
    @Request() req,
    @Body() paginate: PostPaginateDto,
  ): Promise<PostEntity[]> {
    return await this.postService.getAllPostOfUser(
      req.user.userId,
      paginate.page ? paginate.page : 1,
      paginate.pageSize ? paginate.pageSize : 5,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-all-post-by-user-id')
  async getAllPostOfUserById(
    @Request() req,
    @Body() getAllPostByUserId: PostGetAllByUserIdDto,
  ) {
    const page = parseInt(String(getAllPostByUserId.page));
    const pageSize = parseInt(String(getAllPostByUserId.pageSize));
    const userId = parseInt(String(getAllPostByUserId.userId));
    return await this.postService.getAllRawPostByUserId(
      req.user.userId,
      userId,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/search-post')
  async searchAll(@Request() req, @Body() postSearch: PostSearchDto) {
    const page = parseInt(String(postSearch.page));
    const pageSize = parseInt(String(postSearch.pageSize));
    return await this.postService.fullTextSearchPost(
      req.user.userId,
      postSearch.searchQuery,
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
  }
}
