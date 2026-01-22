import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PAGINATION_DEFAULTS } from '@gym-monorepo/shared';

export class TagListQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = PAGINATION_DEFAULTS.PAGE;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit = PAGINATION_DEFAULTS.LIMIT;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsOptional()
  @IsBoolean()
  includeInactive = false;
}
