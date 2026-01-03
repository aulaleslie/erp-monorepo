import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { THEME_PRESETS } from '@gym-monorepo/shared';

export class UpdateTenantThemeSettingsDto {
  @ApiProperty({
    example: 'corporate-blue',
    description: 'ID of the theme preset',
    enum: Object.keys(THEME_PRESETS),
  })
  @IsString()
  presetId: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL to the tenant logo',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
