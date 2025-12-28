import { IsUUID } from 'class-validator';

/**
 * Standard ID parameter DTO with UUID validation
 * Use @Param() params: IdParamDto in controllers for validated route params
 */
export class IdParamDto {
  @IsUUID()
  id: string;
}
