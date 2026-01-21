import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveDocumentDto {
  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectDocumentDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  reason: string;
}

export class RequestRevisionDto {
  @ApiProperty({ description: 'Revision reason' })
  @IsString()
  reason: string;
}

export class CancelDocumentDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
