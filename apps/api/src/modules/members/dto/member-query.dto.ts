import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberStatus } from '@gym-monorepo/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class MemberQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
