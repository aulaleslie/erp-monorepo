import { ApiProperty } from '@nestjs/swagger';
import { THEME_PRESETS } from '@gym-monorepo/shared';

export class GetTenantThemeSettingsDto {
  @ApiProperty({
    example: 'corporate-blue',
    description: 'ID of the theme preset',
    enum: Object.keys(THEME_PRESETS),
  })
  presetId: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL to the tenant logo',
    nullable: true,
  })
  logoUrl?: string;
}
