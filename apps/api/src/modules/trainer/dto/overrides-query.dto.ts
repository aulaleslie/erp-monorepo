import { IsDateString, IsNotEmpty } from 'class-validator';

export class OverridesQueryDto {
  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @IsDateString()
  @IsNotEmpty()
  dateTo: string;
}
