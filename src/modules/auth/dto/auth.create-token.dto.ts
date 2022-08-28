import { UserInfoDto } from './../../user/dto/user-info.dto';

export class CreateTokenDto {
  readonly access_token: string;
  readonly user: UserInfoDto;
}
