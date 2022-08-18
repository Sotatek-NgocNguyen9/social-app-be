import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
export class FriendEntity {
  @PrimaryGeneratedColumn()
  friendRelationshipId: number;

  @ManyToOne(() => UserEntity, (user) => user.user_friends)
  user_: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.user_friends)
  friend_: UserEntity;

  @CreateDateColumn()
  createDate: Date;
}
