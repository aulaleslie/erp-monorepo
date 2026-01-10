import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserForStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @MinLength(6)
  tempPassword: string;

  @IsBoolean()
  @IsOptional()
  attachToTenant?: boolean = true;

  @ValidateIf((dto: CreateUserForStaffDto) => dto.attachToTenant !== false)
  @IsUUID()
  roleId?: string;
}
