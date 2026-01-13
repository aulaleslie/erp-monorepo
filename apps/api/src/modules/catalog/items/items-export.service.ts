import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

import { ItemsService } from './items.service';
import { ExportFormat, ExportItemQueryDto } from './dto/export-item-query.dto';
import { ItemEntity } from '../../../database/entities/item.entity';

type ItemExportValue = string | number | boolean | null | Date | undefined;
type ItemExportRow = Record<string, ItemExportValue>;

@Injectable()
export class ItemsExportService {
  constructor(private readonly itemsService: ItemsService) {}

  async exportItems(tenantId: string, query: ExportItemQueryDto) {
    const queryBuilder = this.itemsService.buildQuery(query, tenantId);

    // Fetch all matching items without pagination
    const items = await queryBuilder.getMany();

    // Transform items to flat rows
    const rows = items.map((item) => this.flattenItem(item));

    // Filter fields if requested
    const finalRows = query.fields
      ? this.filterFields(rows, query.fields)
      : rows;

    // Generate buffer
    return this.generateFile(finalRows, query.format);
  }

  private flattenItem(item: ItemEntity): ItemExportRow {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      serviceKind: item.serviceKind,
      price: item.price,
      status: item.status,
      categoryName: item.category?.name || null,
      categoryCode: item.category?.code || null,
      barcode: item.barcode,
      unit: item.unit,
      tags: item.tags?.join(', '),
      description: item.description,
      durationValue: item.durationValue,
      durationUnit: item.durationUnit,
      sessionCount: item.sessionCount,
      includedPtSessions: item.includedPtSessions,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private filterFields(
    rows: ItemExportRow[],
    fieldsParam: string,
  ): ItemExportRow[] {
    const fields = fieldsParam.split(',').map((f) => f.trim());

    return rows.map((row) => {
      const filteredRow: ItemExportRow = {};
      fields.forEach((field) => {
        if (field in row) {
          filteredRow[field] = row[field];
        }
      });
      return filteredRow;
    });
  }

  private generateFile(rows: ItemExportRow[], format: ExportFormat) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const extension = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const filename = `items-export-${timestamp}.${extension}`;

    let buffer: Buffer;
    let mimetype: string;

    if (format === ExportFormat.CSV) {
      const csvOutput: Buffer = XLSX.write(workbook, {
        bookType: 'csv',
        type: 'buffer',
      }) as Buffer;
      buffer = csvOutput;
      mimetype = 'text/csv';
    } else {
      const xlsxOutput: Buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
      }) as Buffer;
      buffer = xlsxOutput;
      mimetype =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return {
      buffer,
      filename,
      mimetype,
    };
  }
}
