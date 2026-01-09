import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PeopleType } from '@gym-monorepo/shared';

export class CreatePeopleDto {
  @IsOptional()
  @IsEnum(PeopleType)
  type?: PeopleType;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}
