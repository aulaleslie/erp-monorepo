import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ItemDurationUnit,
  ItemServiceKind,
  ItemStatus,
  ItemType,
} from '../../../../database/entities/item.entity';

const normalizeEnumValue = <T extends string>(
  value: unknown,
): T | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toUpperCase() as T;
};

const normalizeFloat = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const stringValue = value.trim();
  if (!stringValue) {
    return undefined;
  }

  return Number.parseFloat(stringValue);
};

const normalizeInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Math.trunc(value);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const stringValue = value.trim();
  if (!stringValue) {
    return undefined;
  }

  return Number.parseInt(stringValue, 10);
};

const normalizeTags = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }

        if (typeof entry === 'number' && Number.isFinite(entry)) {
          return String(entry);
        }

        return undefined;
      })
      .filter((entry): entry is string => !!entry && entry.length > 0)
      .join(',');
    return joined.length > 0 ? joined : undefined;
  }

  if (typeof value === 'string') {
    const stringValue = value.trim();
    return stringValue.length > 0 ? stringValue : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

/**
 * DTO for validating each row during item import.
 * Field names match CSV/XLSX column headers (snake_case).
 */
export class ImportItemRowDto {
  @IsString()
  name: string;

  @IsEnum(ItemType)
  @Transform(({ value }: { value: unknown }) =>
    normalizeEnumValue<ItemType>(value),
  )
  type: ItemType;

  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => normalizeFloat(value))
  price: number;

  @IsOptional()
  @IsEnum(ItemServiceKind)
  @Transform(({ value }: { value: unknown }) =>
    normalizeEnumValue<ItemServiceKind>(value),
  )
  service_kind?: ItemServiceKind;

  @IsOptional()
  @IsEnum(ItemStatus)
  @Transform(({ value }: { value: unknown }) =>
    normalizeEnumValue<ItemStatus>(value),
  )
  status?: ItemStatus;

  @IsOptional()
  @IsString()
  category_name?: string;

  @IsOptional()
  @IsString()
  parent_category_name?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => normalizeTags(value))
  tags?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }: { value: unknown }) => normalizeInteger(value))
  duration_value?: number;

  @IsOptional()
  @IsEnum(ItemDurationUnit)
  @Transform(({ value }: { value: unknown }) =>
    normalizeEnumValue<ItemDurationUnit>(value),
  )
  duration_unit?: ItemDurationUnit;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }: { value: unknown }) => normalizeInteger(value))
  session_count?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => normalizeInteger(value))
  included_pt_sessions?: number;

  @IsOptional()
  @IsString()
  image_url?: string;
}

/**
 * Result of processing a single import row.
 */
export interface ImportRowResult {
  row: number;
  success: boolean;
  itemId?: string;
  itemCode?: string;
  error?: string;
}

/**
 * Overall result of an import operation.
 */
export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
}
