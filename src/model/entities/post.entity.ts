import { type } from 'os';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommentEntity } from './comment.entity';
import { UserEntity } from './user.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  postId: number;

  @Column()
  secure: string;

  @Index({ fulltext: true })
  @Column('text')
  content: string;

  @Column()
  media: string;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.posts)
  user_: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.post_)
  comments: CommentEntity[];
}
