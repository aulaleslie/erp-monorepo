import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberStatus } from '@gym-monorepo/shared';
import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
