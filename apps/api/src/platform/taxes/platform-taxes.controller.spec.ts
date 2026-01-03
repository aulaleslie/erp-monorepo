import { Test, TestingModule } from '@nestjs/testing';
import { PlatformTaxesController } from './platform-taxes.controller';
import { PlatformTaxesService } from './platform-taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxQueryDto } from './dto/tax-query.dto';
import {
  TaxEntity,
  TaxStatus,
  TaxType,
} from '../../database/entities/tax.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AuthGuard } from '@nestjs/passport';

describe('PlatformTaxesController', () => {
  let controller: PlatformTaxesController;

  let _service: PlatformTaxesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformTaxesController],
      providers: [
        {
          provide: PlatformTaxesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlatformTaxesController>(PlatformTaxesController);
    _service = module.get<PlatformTaxesService>(PlatformTaxesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a tax', async () => {
      const dto: CreateTaxDto = {
        name: 'VAT',
        rate: 0.1,
        type: TaxType.PERCENTAGE,
      };
      const result: TaxEntity = {
        id: '1',
        ...dto,
        status: TaxStatus.ACTIVE,
        code: 'VAT',
        amount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      } as unknown as TaxEntity;
      mockService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated taxes', async () => {
      const query: TaxQueryDto = { page: 1, limit: 10 };
      const result: PaginatedResponse<TaxEntity> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(query)).toBe(result);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single tax', async () => {
      const result: TaxEntity = { id: '1', name: 'VAT' } as TaxEntity;
      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
      expect(mockService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a tax', async () => {
      const dto: UpdateTaxDto = { name: 'VAT 2' };
      const result: TaxEntity = { id: '1', name: 'VAT 2' } as TaxEntity;
      mockService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto)).toBe(result);
      expect(mockService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should remove (disable) a tax', async () => {
      mockService.remove.mockResolvedValue(undefined);

      expect(await controller.remove('1')).toBeUndefined();
      expect(mockService.remove).toHaveBeenCalledWith('1');
    });
  });
});
