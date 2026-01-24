import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSalesOrderDto } from './create-sales-order.dto';

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}

export class ConvertOrderDto {
  @ApiPropertyOptional({
    description:
      'Specific items to invoice. If empty, all items are invoiced (Option 2 support)',
  })
  itemIds?: string[];
}
