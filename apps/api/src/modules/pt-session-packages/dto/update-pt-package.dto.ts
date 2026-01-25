import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePtPackageDto {
  @IsUUID()
  @IsOptional()
  preferredTrainerId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
