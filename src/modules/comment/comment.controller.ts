import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { MessageDto } from '../user/dto/message.dto';
import { CommentService } from './comment.service';
import { GetCommentDto } from './dto/comment.get.dto';
import { PostCommentDto } from './dto/comment.post.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('get-comment-of-post')
  async getCommentOfPost(@Request() req, @Body() getComment: GetCommentDto) {
    const page = parseInt(String(getComment.page));
    const pageSize = parseInt(String(getComment.pageSize));
    return await this.commentService.getCommentOfPost(
      req.user.userId,
      parseInt(String(getComment.postId)),
      page ? page : 1,
      pageSize ? pageSize : 5,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('post-comment')
  async postComment(
    @Request() req,
    @Body() postCom: PostCommentDto,
  ): Promise<MessageDto> {
    await this.commentService.postComment(
      req.user.userId,
      parseInt(String(postCom.postId)),
      postCom.text,
    );
    return {
      message: 'COMMENT_ON_POST_SUCCESS',
    };
  }
}
