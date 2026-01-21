import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DocumentModule } from '@gym-monorepo/shared';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document key (e.g., sales.invoice)' })
  @IsString()
  documentKey: string;

  @ApiProperty({ enum: DocumentModule })
  @IsEnum(DocumentModule)
  module: DocumentModule;

  @ApiProperty({ description: 'Document date (ISO 8601)' })
  @IsISO8601()
  documentDate: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'IDR' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Person ID (Customer/Supplier)' })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({ description: 'Person name snapshot' })
  @IsOptional()
  @IsString()
  personName?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
