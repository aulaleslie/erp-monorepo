import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PlatformTaxesService } from './platform-taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxQueryDto } from './dto/tax-query.dto';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@ApiTags('platform')
@ApiCookieAuth('access_token')
@Controller('platform/taxes')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
export class PlatformTaxesController {
  constructor(private readonly platformTaxesService: PlatformTaxesService) {}

  @Post()
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.platformTaxesService.create(createTaxDto);
  }

  @Get()
  findAll(@Query() query: TaxQueryDto) {
    return this.platformTaxesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.platformTaxesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.platformTaxesService.update(id, updateTaxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.platformTaxesService.remove(id);
  }
}
