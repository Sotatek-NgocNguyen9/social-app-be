import { Repository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';

export class PostRepository extends Repository<PostEntity> {}
