import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateGroupSessionDto {
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
