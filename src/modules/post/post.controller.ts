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
import { PostEntity } from 'src/model/entities/post.entity';
import { PostEditDto } from './dto/post.edit.dto';
import { PostDeleteDto } from './dto/post.delete.dto';
import { MessageDto } from '../user/dto/message.dto';
import { PostPaginateDto } from './dto/post.paginate.dto';

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
  @Get('/feeds')
  async getFeeds(@Request() req): Promise<PostEntity[]> {
    const feeds = await this.postService.getFeeds(req.user.userId);
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
    console.log(file);
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
  ): Promise<PostEntity> {
    return await this.postService.getPostByUser(
      parseInt(postId),
      req.user.userId,
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
  @Get('/get-all-post-of-user')
  async getAllPostOfUser(
    @Request() req,
    @Body() paginate: PostPaginateDto,
  ): Promise<PostEntity[]> {
    // pagination page && pageSize
    return await this.postService.getAllPostOfUser(
      req.user.userId,
      paginate.page ? paginate.page : 1,
      paginate.pageSize ? paginate.pageSize : 5,
    );
  }
}
