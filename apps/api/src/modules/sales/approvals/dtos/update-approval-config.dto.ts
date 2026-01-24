import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DOCUMENT_TYPE_KEY } from '@gym-monorepo/shared';

export class ApprovalLevelConfigDto {
  @ApiProperty()
  @IsInt()
  levelIndex: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateApprovalConfigDto {
  @ApiProperty({ enum: DOCUMENT_TYPE_KEY })
  @IsEnum(DOCUMENT_TYPE_KEY)
  documentKey: string;

  @ApiProperty({ type: [ApprovalLevelConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalLevelConfigDto)
  levels: ApprovalLevelConfigDto[];
}
