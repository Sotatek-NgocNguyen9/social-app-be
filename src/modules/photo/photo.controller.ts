import { Controller, Get, Param, Res } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { join } from 'path';

@Controller('photo')
export class PhotoController {
  @Get('profile-image/:imagename')
  findProfileImage(@Param('imagename') imagename, @Res() res): Observable<any> {
    return of(
      res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)),
    );
  }

  @Get('post-image/:imagename')
  findPostImage(@Param('imagename') imagename, @Res() res): Observable<any> {
    return of(
      res.sendFile(join(process.cwd(), 'uploads/postimages/' + imagename)),
    );
  }
}
