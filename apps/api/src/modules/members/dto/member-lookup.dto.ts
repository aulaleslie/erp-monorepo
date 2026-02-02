import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemberLookupDto {
  @ApiProperty({ description: 'Search query (name, code, phone, or email)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q: string;
}
