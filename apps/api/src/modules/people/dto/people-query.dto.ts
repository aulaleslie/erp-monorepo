import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PeopleStatus, PeopleType } from '@gym-monorepo/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PeopleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PeopleType)
  type?: PeopleType;

  @IsOptional()
  @IsEnum(PeopleStatus)
  status: PeopleStatus = PeopleStatus.ACTIVE;
}
