import { type } from 'os';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  postId: number;

  @Column()
  secure: string;

  @Column()
  content: string;

  @Column()
  media: string;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.posts)
  user_: UserEntity;
}
