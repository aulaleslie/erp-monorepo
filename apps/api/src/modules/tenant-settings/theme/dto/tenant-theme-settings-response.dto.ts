import { ApiProperty } from '@nestjs/swagger';
import { ThemeVariant } from '@gym-monorepo/shared';

export class TenantThemeSettingsResponseDto {
  @ApiProperty({
    example: 'corporate-blue',
    description: 'ID of the theme preset',
  })
  presetId: string;

  @ApiProperty({
    description: 'Theme colors for light and dark modes',
  })
  colors: ThemeVariant;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL to the tenant logo',
    nullable: true,
  })
  logoUrl?: string;
}
