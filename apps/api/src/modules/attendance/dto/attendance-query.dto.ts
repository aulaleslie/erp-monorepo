import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceType } from '@gym-monorepo/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AttendanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: AttendanceType })
  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;
}
