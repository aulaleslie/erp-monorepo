import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthResponse } from '@gym-monorepo/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
