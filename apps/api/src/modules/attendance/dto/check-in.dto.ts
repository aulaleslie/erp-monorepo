import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceType, CheckInMethod } from '@gym-monorepo/shared';

export class CheckInDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberPhone?: string;

  @ApiProperty({ enum: AttendanceType })
  @IsEnum(AttendanceType)
  attendanceType: AttendanceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ enum: CheckInMethod, default: CheckInMethod.MANUAL })
  @IsOptional()
  @IsEnum(CheckInMethod)
  checkInMethod: CheckInMethod = CheckInMethod.MANUAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
