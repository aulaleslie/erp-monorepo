import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceType, CheckInMethod } from '@gym-monorepo/shared';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            checkIn: jest.fn(),
            checkOut: jest.fn(),
            findAll: jest.fn(),
            getTodayCheckIns: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(ActiveTenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('checkIn', () => {
    it('should call attendanceService.checkIn', async () => {
      const dto: CheckInDto = {
        memberId: 'member-123',
        attendanceType: AttendanceType.GYM_ENTRY,
        checkInMethod: CheckInMethod.MANUAL,
      };

      await controller.checkIn(mockTenantId, mockUserId, dto);

      expect(service.checkIn).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        dto,
      );
    });
  });

  describe('checkOut', () => {
    it('should call attendanceService.checkOut', async () => {
      const id = 'att-1';
      await controller.checkOut(mockTenantId, id);

      expect(service.checkOut).toHaveBeenCalledWith(mockTenantId, id);
    });
  });

  describe('findAll', () => {
    it('should call attendanceService.findAll', async () => {
      const query: AttendanceQueryDto = { page: 1, limit: 10 };
      await controller.findAll(mockTenantId, query);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, query);
    });
  });

  describe('getTodayCheckIns', () => {
    it('should call attendanceService.getTodayCheckIns', async () => {
      await controller.getTodayCheckIns(mockTenantId);

      expect(service.getTodayCheckIns).toHaveBeenCalledWith(mockTenantId);
    });
  });
});
