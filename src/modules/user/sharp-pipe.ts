import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SharpPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  async transform(image: Express.Multer.File): Promise<string> {
    if (image) {
      const imageName: string =
        Date.now() +
        '-' +
        path.parse(image.originalname).name.replace(/\s/g, '') +
        uuidv4() +
        '.webp';
      await sharp(image.buffer)
        .webp({ effort: 3 })
        .toFile(path.join('uploads/profileimages', imageName));
      return imageName;
    }
    return null;
  }
}
