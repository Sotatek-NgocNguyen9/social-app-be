import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

@Controller('photo')
export class PhotoController {
  @Get('profile-image/:imagename')
  async findProfileImage(@Param('imagename') imagename, @Res() res) {
    const path = join(process.cwd(), 'uploads/profileimages/' + imagename);
    if (existsSync(path)) {
      const file = createReadStream(path);
      file.pipe(res);
    } else {
      return 'not found image';
    }
    return 'not found image';
  }

  @Get('post-image/:imagename')
  findPostImage(@Param('imagename') imagename, @Res() res) {
    const path = join(process.cwd(), 'uploads/postimages/' + imagename);
    if (existsSync(path)) {
      const file = createReadStream(path);
      file.pipe(res);
    } else {
      return 'not found image';
    }
    return 'not found image';
  }
}
