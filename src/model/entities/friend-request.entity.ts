import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
export class FriendRequestEntity {
  @PrimaryGeneratedColumn()
  friendRequestId: number;

  @ManyToOne(() => UserEntity, (user) => user.user_request_fr)
  user_: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.requester)
  requester_: UserEntity;

  @CreateDateColumn()
  createDate: Date;
}
