import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesPdfService } from './sales-pdf.service';
import { DocumentEntity, TenantEntity } from '../../../database/entities';
import { StorageService } from '../../storage/storage.service';
import { DOCUMENT_TYPE_KEY } from '@gym-monorepo/shared';

describe('SalesPdfService', () => {
  let service: SalesPdfService;
  let documentRepository: Record<string, jest.Mock>;
  let tenantRepository: Record<string, jest.Mock>;
  let storageService: Record<string, jest.Mock>;

  beforeEach(async () => {
    documentRepository = {
      findOne: jest.fn(),
    };
    tenantRepository = {
      findOne: jest.fn(),
    };
    storageService = {
      exists: jest.fn(),
      getPublicUrl: jest.fn(),
      uploadDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesPdfService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: documentRepository,
        },
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: tenantRepository,
        },
        {
          provide: StorageService,
          useValue: storageService,
        },
      ],
    }).compile();

    service = module.get<SalesPdfService>(SalesPdfService);
  });

  it('should return existing PDF URL if exists and not forced', async () => {
    const tenantId = 'tenant-1';
    const documentId = 'doc-1';
    const objectKey = `sales/pdfs/${tenantId}/${documentId}.pdf`;
    const expectedUrl = 'http://storage/pdf.pdf';

    storageService.exists.mockResolvedValue(true);
    storageService.getPublicUrl.mockReturnValue(expectedUrl);

    const url = await service.getPdfUrl(tenantId, documentId);

    expect(url).toBe(expectedUrl);
    expect(storageService.exists).toHaveBeenCalledWith(objectKey);
    expect(documentRepository.findOne).not.toHaveBeenCalled();
  });

  it('should generate and upload new PDF if forced or not exists', async () => {
    const tenantId = 'tenant-1';
    const documentId = 'doc-1';
    const expectedUrl = 'http://storage/new-pdf.pdf';

    const mockDocument = {
      id: documentId,
      number: 'SO-001',
      documentKey: DOCUMENT_TYPE_KEY.SALES_ORDER,
      documentDate: new Date(),
      total: 1000,
      currencyCode: 'IDR',
      subtotal: 900,
      taxTotal: 100,
      discountTotal: 0,
      items: [],
      salesHeader: {},
    };

    const mockTenant = {
      id: tenantId,
      name: 'Test Tenant',
    };

    storageService.exists.mockResolvedValue(false);
    documentRepository.findOne.mockResolvedValue(mockDocument);
    tenantRepository.findOne.mockResolvedValue(mockTenant);
    storageService.uploadDocument.mockResolvedValue(expectedUrl);

    const url = await service.getPdfUrl(tenantId, documentId, true);

    expect(url).toBe(expectedUrl);
    expect(documentRepository.findOne).toHaveBeenCalled();
    expect(storageService.uploadDocument).toHaveBeenCalled();
  });
});
