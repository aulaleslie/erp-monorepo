import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDocumentNumberSettingsDto {
  @ApiPropertyOptional({ description: 'Document prefix', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string;

  @ApiPropertyOptional({
    description: 'Number padding length',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  paddingLength?: number;

  @ApiPropertyOptional({
    description: 'Whether to include period in the number',
  })
  @IsOptional()
  @IsBoolean()
  includePeriod?: boolean;

  @ApiPropertyOptional({ description: 'Period format (e.g., yyyy-MM)' })
  @IsOptional()
  @IsString()
  periodFormat?: string;
}

export class DocumentNumberSettingsResponseDto {
  @ApiProperty()
  documentKey: string;

  @ApiProperty()
  prefix: string;

  @ApiProperty()
  paddingLength: number;

  @ApiProperty()
  includePeriod: boolean;

  @ApiProperty()
  periodFormat: string;

  @ApiPropertyOptional()
  lastPeriod: string | null;

  @ApiProperty()
  currentCounter: number;
}
