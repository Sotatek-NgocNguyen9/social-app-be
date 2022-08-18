import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './model/entities/user.entity';
import { QueueModule } from './modules/queue/queue.module';
import { UserModule } from './modules/user/user.module';
import { AuthenticationModule } from './modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { PhotoModule } from './modules/photo/photo.module';
import { PostModule } from './modules/post/post.module';
import { PostEntity } from './model/entities/post.entity';
import { FriendEntity } from './model/entities/friend.entity';
import { FriendRequestEntity } from './model/entities/friend-request.entity';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { CacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { FriendModule } from './modules/friend/friend.module';

export const Modules = [
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: 'fresherk2',
    entities: [FriendRequestEntity, FriendEntity, PostEntity, UserEntity],
    synchronize: true,
  }),
  BullModule.forRoot({
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
  }),
  MailerModule.forRoot({
    transport: {
      host: process.env.HOST_SMTP,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    template: {
      dir: join(process.cwd(), 'src/mails'),
      adapter: new HandlebarsAdapter(),
    },
  }),
  CacheModule.register({
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    isGlobal: true,
  }),
  QueueModule,
  UserModule,
  AuthenticationModule,
  PhotoModule,
  PostModule,
  FriendModule,
];
