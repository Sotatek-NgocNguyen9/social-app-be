/* eslint-disable prettier/prettier */
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn  } from 'typeorm';
import { Exclude } from 'class-transformer';
import { PostEntity } from './post.entity';
import { FriendEntity } from './friend.entity';
import { FriendRequestEntity } from './friend-request.entity';
import { CommentEntity } from './comment.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  userId: number;

  @Index({ fulltext: true })
  @Column('varchar')
  name: string;

  @Column({ unique: true })
  username: string;

  @Index({ fulltext: true })
  @Column('varchar')
  location: string;

  @Index({ fulltext: true })
  @Column('text')
  bio: string;

  @Column()
  facebook: string;

  @Column()
  instagram: string;

  @Column()
  linkedin: string;

  @Column()
  password: string;

  @Column()
  profileImage: string;

  @Column('boolean', { default: false })
  isActivate: boolean;

  @Exclude()
  public currentHashedRefreshToken?: string;

  @OneToMany(() => PostEntity, (post) => post.user_)
  posts: PostEntity[];

  @OneToMany(() => FriendEntity, (friend) => friend.user_)
  user_friends: FriendEntity[];
  
  @OneToMany(() => FriendEntity, (friend) => friend.friend_)
  friends: FriendEntity[];

  @OneToMany(() => FriendRequestEntity, (friendReq) => friendReq.user_)
  user_request_fr: FriendRequestEntity[];
  
  @OneToMany(() => FriendRequestEntity, (friendReq) => friendReq.requester_)
  requester: FriendRequestEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.user_)
  comments: CommentEntity[];
}
