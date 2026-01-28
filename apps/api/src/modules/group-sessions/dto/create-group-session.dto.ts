import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateGroupSessionDto {
  @IsUUID()
  @IsNotEmpty()
  purchaserMemberId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string | Date;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePaid: number;

  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  totalSessions?: number;
}
