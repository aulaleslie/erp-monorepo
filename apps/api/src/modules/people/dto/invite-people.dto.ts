import { IsNotEmpty, IsUUID } from 'class-validator';

export class InvitePeopleDto {
  @IsUUID('4')
  @IsNotEmpty()
  personId: string;
}
