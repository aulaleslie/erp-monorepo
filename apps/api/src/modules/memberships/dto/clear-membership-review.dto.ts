import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ClearMembershipReviewDto {
  @IsEnum(['KEEP', 'CANCEL'])
  action: 'KEEP' | 'CANCEL';

  @IsOptional()
  @IsString()
  reason?: string;
}
