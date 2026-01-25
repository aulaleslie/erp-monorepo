import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePtPackageDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePaid: number;

  @IsUUID()
  @IsOptional()
  preferredTrainerId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
