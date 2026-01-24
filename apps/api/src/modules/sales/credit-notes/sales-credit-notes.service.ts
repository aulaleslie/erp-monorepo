import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  DocumentModule,
  DocumentStatus,
  DOCUMENT_TYPE_KEY,
  DocumentRelationType,
  SALES_ERRORS,
} from '@gym-monorepo/shared';
import {
  DocumentEntity,
  DocumentItemEntity,
  DocumentRelationEntity,
  SalesHeaderEntity,
  ItemEntity,
  TagEntity,
  TagLinkEntity,
} from '../../../database/entities';
import { DocumentsService } from '../../documents/documents.service';
import { UpdateSalesCreditNoteDto } from './dtos/update-sales-credit-note.dto';
import { CreateSalesCreditNoteDto } from './dtos/create-sales-credit-note.dto';
import { SalesApprovalsService } from '../approvals/sales-approvals.service';

@Injectable()
export class SalesCreditNotesService {
  constructor(
    @InjectRepository(SalesHeaderEntity)
    private readonly salesHeaderRepository: Repository<SalesHeaderEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentItemEntity)
    private readonly documentItemRepository: Repository<DocumentItemEntity>,
    @InjectRepository(DocumentRelationEntity)
    private readonly relationRepository: Repository<DocumentRelationEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    private readonly documentsService: DocumentsService,
    private readonly salesApprovalsService: SalesApprovalsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    tenantId: string,
    query: {
      status?: DocumentStatus;
      personId?: string;
      number?: string;
      search?: string;
      tag?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const {
      status,
      personId,
      number,
      search,
      tag,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.salesHeader', 'salesHeader')
      .leftJoinAndSelect('document.person', 'person')
      .where('document.tenantId = :tenantId', { tenantId })
      .andWhere('document.documentKey = :key', {
        key: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
      });

    if (status) {
      qb.andWhere('document.status = :status', { status });
    }

    if (personId) {
      qb.andWhere('document.personId = :personId', { personId });
    }

    if (number) {
      qb.andWhere('document.number ILIKE :number', { number: `%${number}%` });
    }

    if (search) {
      qb.andWhere(
        '(document.number ILIKE :search OR document.notes ILIKE :search OR person.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (dateFrom) {
      qb.andWhere('document.documentDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('document.documentDate <= :dateTo', { dateTo });
    }

    if (tag) {
      qb.innerJoin(
        TagLinkEntity,
        'tagLink',
        'tagLink.resourceId = document.id AND tagLink.resourceType = :resourceType',
        { resourceType: 'sales.documents' },
      )
        .innerJoin(TagEntity, 't', 't.id = tagLink.tagId')
        .andWhere('(t.name = :tag OR t.nameNormalized = :tag)', {
          tag: tag.toLowerCase(),
        });
    }

    qb.orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    tenantId: string,
    _userId: string,
  ): Promise<DocumentEntity> {
    const document = await this.documentRepository.findOne({
      where: {
        id,
        tenantId,
        documentKey: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
      },
      relations: {
        salesHeader: {
          salesperson: true,
        },
        person: true,
        items: {
          item: true,
        },
        toRelations: {
          toDocument: true,
          fromDocument: true, // Show the invoice it came from
        },
      },
    });

    if (!document) {
      throw new NotFoundException(SALES_ERRORS.NOT_FOUND.message);
    }

    return document;
  }

  async createFromInvoice(
    invoiceId: string,
    tenantId: string,
    dto: CreateSalesCreditNoteDto,
    userId: string,
  ): Promise<DocumentEntity> {
    const invoice = await this.documentRepository.findOne({
      where: {
        id: invoiceId,
        tenantId,
        documentKey: DOCUMENT_TYPE_KEY.SALES_INVOICE,
      },
      relations: {
        salesHeader: true,
        items: { item: true },
        person: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== DocumentStatus.POSTED) {
      throw new BadRequestException(
        'Credit Note can only be created from a POSTED Invoice',
      );
    }

    // Check if a credit note already exists for this invoice?
    // Requirement doesn't explicitly forbid multiple credit notes.
    // However, usually it's good to check or allow partial credits.
    // For now, we allow multiple.

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Base Document
      const document = await this.documentsService.create(
        tenantId,
        DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
        DocumentModule.SALES,
        {
          documentDate: new Date(),
          // Credit Note doesn't technically have a due date in the same way, but we can set it to now or null if allowed.
          // DocumentsService create DTO might require it or it might be optional.
          // Let's assume documentDate is enough.
          personId: invoice.personId,
          notes: dto.notes || `Credit Note for Invoice ${invoice.number}`,
          currencyCode: invoice.currencyCode,
          subtotal: invoice.subtotal,
          discountTotal: invoice.discountTotal,
          taxTotal: invoice.taxTotal,
          total: invoice.total,
        },
        userId,
      );

      // 2. Clone Sales Header
      const header = manager.create(SalesHeaderEntity, {
        tenantId,
        documentId: document.id,
        salespersonPersonId: invoice.salesHeader?.salespersonPersonId || null,
        externalRef: invoice.salesHeader?.externalRef || null,
        paymentTerms: invoice.salesHeader?.paymentTerms || null,
        taxPricingMode: invoice.salesHeader?.taxPricingMode,
        billingAddressSnapshot:
          invoice.salesHeader?.billingAddressSnapshot || null,
        shippingAddressSnapshot:
          invoice.salesHeader?.shippingAddressSnapshot || null,
      });
      await manager.save(header);

      // 3. Clone Items
      for (const item of invoice.items) {
        const docItem = manager.create(DocumentItemEntity, {
          documentId: document.id,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
          metadata: item.metadata,
        });
        await manager.save(docItem);
      }

      // 4. Create Relation
      const relation = manager.create(DocumentRelationEntity, {
        tenantId,
        fromDocumentId: invoice.id,
        toDocumentId: document.id,
        relationType: DocumentRelationType.INVOICE_TO_CREDIT,
      });
      await manager.save(relation);

      // Return the new document
      return manager.findOne(DocumentEntity, {
        where: {
          id: document.id,
          tenantId,
          documentKey: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
        },
        relations: {
          salesHeader: {
            salesperson: true,
          },
          person: true,
          items: {
            item: true,
          },
          toRelations: {
            toDocument: true,
            fromDocument: true,
          },
        },
      }) as Promise<DocumentEntity>;
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateSalesCreditNoteDto,
    userId: string,
  ): Promise<DocumentEntity> {
    const document = await this.findOne(id, tenantId, userId);

    if (document.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT documents can be updated.');
    }

    return this.dataSource.transaction(async (manager) => {
      // Update base document
      const updateDoc: Partial<DocumentEntity> = { updatedBy: userId };
      if (dto.documentDate) updateDoc.documentDate = new Date(dto.documentDate);
      if (dto.notes !== undefined) updateDoc.notes = dto.notes;

      // Update Sales Header
      const header = document.salesHeader;
      if (dto.taxPricingMode) {
        header.taxPricingMode = dto.taxPricingMode;
        header.updatedBy = userId;
        await manager.save(header);
      }

      // Update Items
      if (dto.items) {
        await manager.delete(DocumentItemEntity, { documentId: id });

        let totalAmount = 0;

        for (const [index, itemDto] of dto.items.entries()) {
          const item = await manager.findOne(ItemEntity, {
            where: { id: itemDto.itemId, tenantId },
          });
          if (!item)
            throw new BadRequestException(`Item ${itemDto.itemId} not found`);

          const discountAmountPerUnit =
            (itemDto.unitPrice * (itemDto.discountPercent || 0)) / 100;

          const lineTotal =
            (itemDto.unitPrice - discountAmountPerUnit) * itemDto.quantity;

          totalAmount += lineTotal;

          const docItem = manager.create(DocumentItemEntity, {
            documentId: document.id,
            itemId: item.id,
            itemName: item.name,
            itemType: item.type,
            description: itemDto.description || item.description,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            discountAmount: discountAmountPerUnit * itemDto.quantity,
            lineTotal: lineTotal,
            sortOrder: index,
            metadata: {
              discountPercent: itemDto.discountPercent || 0,
            },
          });
          await manager.save(docItem);
        }

        updateDoc.subtotal = totalAmount; // Simplified match
        updateDoc.total = totalAmount;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await manager.update(DocumentEntity, id, updateDoc as any);

      return manager.findOne(DocumentEntity, {
        where: {
          id: document.id,
          tenantId,
          documentKey: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
        },
        relations: {
          salesHeader: {
            salesperson: true,
          },
          person: true,
          items: {
            item: true,
          },
          toRelations: {
            toDocument: true,
            fromDocument: true,
          },
        },
      }) as Promise<DocumentEntity>;
    });
  }

  // Approval actions delegated to SalesApprovalsService
  async submit(id: string, tenantId: string, userId: string) {
    return this.salesApprovalsService.submit(id, tenantId, userId);
  }

  async approve(
    id: string,
    notes: string | null,
    tenantId: string,
    userId: string,
  ) {
    return this.salesApprovalsService.approve(id, notes, tenantId, userId);
  }

  async reject(id: string, notes: string, tenantId: string, userId: string) {
    return this.salesApprovalsService.reject(id, notes, tenantId, userId);
  }

  async requestRevision(
    id: string,
    notes: string,
    tenantId: string,
    userId: string,
  ) {
    return this.salesApprovalsService.requestRevision(
      id,
      notes,
      tenantId,
      userId,
    );
  }

  async cancel(id: string, notes: string, tenantId: string, userId: string) {
    const document = await this.findOne(id, tenantId, userId);
    if (document.status === DocumentStatus.POSTED) {
      throw new BadRequestException('Cannot cancel a POSTED Credit Note');
    }
    return this.documentsService.cancel(id, notes, tenantId, userId);
  }

  async post(id: string, tenantId: string, userId: string) {
    const document = await this.findOne(id, tenantId, userId);

    if (document.documentKey !== DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE) {
      throw new BadRequestException('Not a credit note');
    }

    // Future: Accounting Journal Entry creation here

    return this.documentsService.post(id, tenantId, userId);
  }
}
