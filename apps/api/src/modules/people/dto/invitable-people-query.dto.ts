import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PeopleType } from '@gym-monorepo/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InvitablePeopleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PeopleType)
  type?: PeopleType;
}
