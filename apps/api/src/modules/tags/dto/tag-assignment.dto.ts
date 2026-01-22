import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class TagAssignmentDto {
  @IsNotEmpty()
  @IsString()
  resourceType: string;

  @IsUUID()
  resourceId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];
}
