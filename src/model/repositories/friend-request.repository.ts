import { Repository } from 'typeorm';
import { FriendRequestEntity } from '../entities/friend-request.entity';

export class FriendRequestRepository extends Repository<FriendRequestEntity> {}
