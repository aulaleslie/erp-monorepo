import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemQueryDto } from './item-query.dto';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export class ExportItemQueryDto extends ItemQueryDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsString()
  fields?: string;
}
