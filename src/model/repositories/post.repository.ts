import { Repository } from 'typeorm';
import { PostEntity } from 'src/model/entities/post.entity';

export class PostRepository extends Repository<PostEntity> {}
