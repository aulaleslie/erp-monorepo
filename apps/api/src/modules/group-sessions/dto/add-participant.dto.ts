import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddParticipantDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;
}
