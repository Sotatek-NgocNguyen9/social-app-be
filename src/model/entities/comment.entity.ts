import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PostEntity } from './post.entity';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  commentId: number;

  @ManyToOne(() => UserEntity, (user) => user.comments)
  user_: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.comments)
  post_: PostEntity;

  @Column()
  text: string;

  @CreateDateColumn()
  createDate: Date;
}
