import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { DocumentEntity, TenantEntity } from '../../../database/entities';
import { StorageService } from '../../storage/storage.service';
import { DOCUMENT_TYPE_KEY } from '@gym-monorepo/shared';

@Injectable()
export class SalesPdfService {
  private readonly logger = new Logger(SalesPdfService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get PDF URL for a document. Generates if not exists or if force is true.
   */
  async getPdfUrl(
    tenantId: string,
    documentId: string,
    force = false,
  ): Promise<string> {
    const objectKey = `sales/pdfs/${tenantId}/${documentId}.pdf`;

    if (!force) {
      const exists = await this.storageService.exists(objectKey);
      if (exists) {
        return this.storageService.getPublicUrl(objectKey);
      }
    }

    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId },
      relations: {
        items: true,
        salesHeader: {
          salesperson: true,
        },
        person: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const pdfBuffer = await this.generatePdf(document, tenant);

    return this.storageService.uploadDocument(
      pdfBuffer,
      objectKey,
      'application/pdf',
      pdfBuffer.length,
    );
  }

  private async generatePdf(
    document: DocumentEntity,
    tenant: TenantEntity,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.generateHeader(doc, document, tenant);
      this.generateCustomerInformation(doc, document);
      this.generateInvoiceTable(doc, document);
      this.generateFooter(doc, document);

      doc.end();
    });
  }

  private generateHeader(
    doc: PDFKit.PDFDocument,
    document: DocumentEntity,
    tenant: TenantEntity,
  ) {
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text(tenant.name, 110, 57)
      .fontSize(10)
      .text(tenant.name, 200, 50, { align: 'right' })
      .moveDown();

    const title = this.getDocumentTitle(document.documentKey);
    doc.fillColor('#444444').fontSize(20).text(title, 50, 160);

    this.generateHr(doc, 185);
  }

  private generateCustomerInformation(
    doc: PDFKit.PDFDocument,
    document: DocumentEntity,
  ) {
    const customerInfoTop = 200;

    doc
      .fontSize(10)
      .text('Document Number:', 50, customerInfoTop)
      .font('Helvetica-Bold')
      .text(document.number, 150, customerInfoTop)
      .font('Helvetica')
      .text('Document Date:', 50, customerInfoTop + 15)
      .text(
        document.documentDate.toLocaleDateString(),
        150,
        customerInfoTop + 15,
      )
      .text('Total Amount:', 50, customerInfoTop + 30)
      .text(
        this.formatCurrency(document.total, document.currencyCode),
        150,
        customerInfoTop + 30,
      )

      .font('Helvetica-Bold')
      .text(document.personName || 'N/A', 300, customerInfoTop)
      .font('Helvetica')
      .text(
        document.salesHeader?.billingAddressSnapshot || '',
        300,
        customerInfoTop + 15,
      )
      .moveDown();

    this.generateHr(doc, 252);
  }

  private generateInvoiceTable(
    doc: PDFKit.PDFDocument,
    document: DocumentEntity,
  ) {
    const invoiceTableTop = 330;

    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      invoiceTableTop,
      'Item',
      'Description',
      'Unit Cost',
      'Quantity',
      'Line Total',
    );
    this.generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    let currentY = invoiceTableTop + 20;
    for (const item of document.items) {
      const position = currentY + 10;
      this.generateTableRow(
        doc,
        position,
        item.itemName,
        item.description || '',
        this.formatCurrency(item.unitPrice, document.currencyCode),
        item.quantity.toString(),
        this.formatCurrency(item.lineTotal, document.currencyCode),
      );

      this.generateHr(doc, position + 20);
      currentY = position + 20;
    }

    const subtotalPosition = currentY + 10;
    this.generateTableRow(
      doc,
      subtotalPosition,
      '',
      '',
      'Subtotal',
      '',
      this.formatCurrency(document.subtotal, document.currencyCode),
    );

    const taxPosition = subtotalPosition + 20;
    this.generateTableRow(
      doc,
      taxPosition,
      '',
      '',
      'Tax',
      '',
      this.formatCurrency(document.taxTotal, document.currencyCode),
    );

    const discountPosition = taxPosition + 20;
    this.generateTableRow(
      doc,
      discountPosition,
      '',
      '',
      'Discount',
      '',
      this.formatCurrency(document.discountTotal, document.currencyCode),
    );

    const dueAtBoundNumber = taxPosition + 25;
    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      dueAtBoundNumber + 20,
      '',
      '',
      'Total',
      '',
      this.formatCurrency(document.total, document.currencyCode),
    );
    doc.font('Helvetica');
  }

  private generateFooter(doc: PDFKit.PDFDocument, _document: DocumentEntity) {
    doc.fontSize(10).text('Thank you for your business.', 50, 700, {
      align: 'center',
      width: 500,
    });
  }

  private generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    item: string,
    description: string,
    unitCost: string,
    quantity: string,
    lineTotal: string,
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(description, 150, y)
      .text(unitCost, 280, y, { width: 90, align: 'right' })
      .text(quantity, 370, y, { width: 90, align: 'right' })
      .text(lineTotal, 0, y, { align: 'right' });
  }

  private generateHr(doc: PDFKit.PDFDocument, y: number) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

  private formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  private getDocumentTitle(key: string): string {
    switch (key) {
      case DOCUMENT_TYPE_KEY.SALES_ORDER:
        return 'SALES ORDER';
      case DOCUMENT_TYPE_KEY.SALES_INVOICE:
        return 'SALES INVOICE';
      case DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE:
        return 'CREDIT NOTE';
      default:
        return 'DOCUMENT';
    }
  }
}
