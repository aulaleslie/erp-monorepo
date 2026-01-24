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
  SALES_ERRORS,
  PEOPLE_ERRORS,
  PeopleType,
  PeopleStatus,
} from '@gym-monorepo/shared';
import {
  DocumentEntity,
  DocumentItemEntity,
  DocumentRelationEntity,
  SalesHeaderEntity,
  PeopleEntity,
  ItemEntity,
  TagEntity,
  TagLinkEntity,
} from '../../../database/entities';
import { DocumentsService } from '../../documents/documents.service';
import { CreateSalesInvoiceDto } from './dtos/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dtos/update-sales-invoice.dto';

@Injectable()
export class SalesInvoicesService {
  constructor(
    @InjectRepository(SalesHeaderEntity)
    private readonly salesHeaderRepository: Repository<SalesHeaderEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentItemEntity)
    private readonly documentItemRepository: Repository<DocumentItemEntity>,
    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,
    @InjectRepository(DocumentRelationEntity)
    private readonly relationRepository: Repository<DocumentRelationEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    private readonly documentsService: DocumentsService,
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
      .leftJoinAndSelect('salesHeader.salesperson', 'salesperson')
      .where('document.tenantId = :tenantId', { tenantId })
      .andWhere('document.documentKey = :key', {
        key: DOCUMENT_TYPE_KEY.SALES_INVOICE,
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
        documentKey: DOCUMENT_TYPE_KEY.SALES_INVOICE,
      },
      relations: {
        salesHeader: {
          salesperson: true,
        },
        person: true,
        items: {
          item: true,
        },
      },
    });

    if (!document) {
      throw new NotFoundException(SALES_ERRORS.NOT_FOUND.message);
    }

    return document;
  }

  async create(
    tenantId: string,
    dto: CreateSalesInvoiceDto,
    userId: string,
  ): Promise<DocumentEntity> {
    const { items } = dto;

    await this.validateCustomer(tenantId, dto.personId);
    if (dto.salespersonPersonId) {
      await this.validateSalesperson(tenantId, dto.salespersonPersonId);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Base Document
      const document = await this.documentsService.create(
        tenantId,
        DOCUMENT_TYPE_KEY.SALES_INVOICE,
        DocumentModule.SALES,
        {
          documentDate: new Date(dto.documentDate),
          dueDate: new Date(dto.dueDate),
          personId: dto.personId,
          notes: dto.notes,
          currencyCode: 'IDR',
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          total: 0,
        },
        userId,
      );

      // 2. Create items
      let totalAmount = 0;
      for (const [index, itemDto] of items.entries()) {
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

      // Update document totals
      document.subtotal = totalAmount;
      document.total = totalAmount;
      await manager.save(document);

      // 3. Create Sales Header
      const header = manager.create(SalesHeaderEntity, {
        tenantId,
        documentId: document.id,
        salespersonPersonId: dto.salespersonPersonId || null,
        externalRef: dto.externalRef || null,
        paymentTerms: dto.paymentTerms || null,
        taxPricingMode: dto.taxPricingMode,
        billingAddressSnapshot: dto.billingAddressSnapshot || null,
        shippingAddressSnapshot: dto.shippingAddressSnapshot || null,
      });
      await manager.save(header);

      return manager.findOne(DocumentEntity, {
        where: {
          id: document.id,
          tenantId,
          documentKey: DOCUMENT_TYPE_KEY.SALES_INVOICE,
        },
        relations: {
          salesHeader: {
            salesperson: true,
          },
          person: true,
          items: {
            item: true,
          },
        },
      }) as Promise<DocumentEntity>;
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateSalesInvoiceDto,
    userId: string,
  ): Promise<DocumentEntity> {
    const document = await this.findOne(id, tenantId, userId);

    if (document.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT documents can be updated. Use revision request for other statuses.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.personId) await this.validateCustomer(tenantId, dto.personId);
      if (dto.salespersonPersonId)
        await this.validateSalesperson(tenantId, dto.salespersonPersonId);

      // Update base document
      if (dto.documentDate) document.documentDate = new Date(dto.documentDate);
      if (dto.dueDate) document.dueDate = new Date(dto.dueDate);
      if (dto.personId) document.personId = dto.personId;
      if (dto.notes !== undefined) document.notes = dto.notes;
      document.updatedBy = userId;

      // Update Sales Header
      const header = document.salesHeader;
      if (dto.salespersonPersonId !== undefined)
        header.salespersonPersonId = dto.salespersonPersonId;
      if (dto.externalRef !== undefined) header.externalRef = dto.externalRef;
      if (dto.paymentTerms !== undefined)
        header.paymentTerms = dto.paymentTerms;
      if (dto.taxPricingMode) header.taxPricingMode = dto.taxPricingMode;
      if (dto.billingAddressSnapshot !== undefined)
        header.billingAddressSnapshot = dto.billingAddressSnapshot;
      if (dto.shippingAddressSnapshot !== undefined)
        header.shippingAddressSnapshot = dto.shippingAddressSnapshot;
      header.updatedBy = userId;
      await manager.save(header);

      // Update Items if provided
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
        document.total = totalAmount;
      }

      await manager.save(document);
      return this.findOne(id, tenantId, userId);
    });
  }

  private async validateCustomer(tenantId: string, personId: string) {
    const person = await this.peopleRepository.findOne({
      where: { id: personId, tenantId },
    });
    if (!person) throw new NotFoundException(PEOPLE_ERRORS.NOT_FOUND.message);
    if (person.type !== PeopleType.CUSTOMER)
      throw new BadRequestException(SALES_ERRORS.INVALID_PERSON.message);
    if (person.status !== PeopleStatus.ACTIVE)
      throw new BadRequestException(SALES_ERRORS.INVALID_PERSON.message);
  }

  private async validateSalesperson(tenantId: string, personId: string) {
    const person = await this.peopleRepository.findOne({
      where: { id: personId, tenantId },
    });
    if (!person) throw new NotFoundException(PEOPLE_ERRORS.NOT_FOUND.message);
    if (person.type !== PeopleType.STAFF)
      throw new BadRequestException('Salesperson must be STAFF');
  }

  // Helper methods to delegate to DocumentsService
  async submit(id: string, tenantId: string, userId: string) {
    return this.documentsService.submit(id, tenantId, userId);
  }

  async approveStep(
    id: string,
    stepIndex: number,
    notes: string,
    tenantId: string,
    userId: string,
  ) {
    return this.documentsService.approveStep(
      id,
      stepIndex,
      notes,
      tenantId,
      userId,
    );
  }

  async reject(id: string, notes: string, tenantId: string, userId: string) {
    return this.documentsService.reject(id, notes, tenantId, userId);
  }

  async requestRevision(
    id: string,
    notes: string,
    tenantId: string,
    userId: string,
  ) {
    return this.documentsService.requestRevision(id, notes, tenantId, userId);
  }

  async cancel(id: string, notes: string, tenantId: string, userId: string) {
    return this.documentsService.cancel(id, notes, tenantId, userId);
  }

  async post(id: string, tenantId: string, userId: string) {
    const document = await this.findOne(id, tenantId, userId);

    // Only invoices can be posted
    if (document.documentKey !== DOCUMENT_TYPE_KEY.SALES_INVOICE) {
      throw new BadRequestException('Only invoices can be posted');
    }

    return this.documentsService.post(id, tenantId, userId);
  }
}
