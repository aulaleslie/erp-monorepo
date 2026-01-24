
import { INestApplication, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { JwtService } from '@nestjs/jwt';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtStrategy } from '../../src/modules/auth/jwt.strategy';
import { UsersService } from '../../src/modules/users/users.service';
import { TenantsService } from '../../src/modules/tenants/tenants.service';
import { SalesApprovalsService } from '../../src/modules/sales/approvals/sales-approvals.service';

// Mock Strategy to simplify auth in tests
@Injectable()
export class MockJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
           // Try cookie
           if (request?.cookies?.access_token) return request.cookies.access_token;
           // Try header (fallback for easier testing)
           if (request?.headers?.authorization) {
               const [type, token] = request.headers.authorization.split(' ');
               if (type === 'Bearer') return token;
           }
           return null;
        }
      ]),
      ignoreExpiration: true,
      secretOrKey: 'secret', // Use hardcoded secret for mock
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}

// Helper to create a mock JWT for a user with specific permissions
const createMockToken = (jwtService: JwtService, secret: string, userId: string, tenantId: string, permissions: string[]) => {
  return jwtService.sign({
    sub: userId,
    email: 'test@example.com',
    tenants: [
      {
        tenantId,
        roleId: 'role-1',
        permissions,
      },
    ],
    activeTenantId: tenantId,
  }, { secret });
};

describe('SalesApprovalsController (e2e)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let secret: string = 'secret';
  
  // Mutable permissions for mocking
  let mockUserPermissions: string[] = [];

  const mockUsersService = {
    getPermissions: jest.fn().mockImplementation(() => Promise.resolve({
      permissions: mockUserPermissions,
      superAdmin: false,
    })),
  };

  const mockTenantsService = {
    validateTenantAccess: jest.fn().mockResolvedValue(true),
  };

  const mockSalesApprovalsService = {
    getConfig: jest.fn().mockResolvedValue([]),
    updateConfig: jest.fn().mockResolvedValue([]),
  };

  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(JwtStrategy)
      .useClass(MockJwtStrategy)
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(TenantsService)
      .useValue(mockTenantsService)
      .overrideProvider(SalesApprovalsService)
      .useValue(mockSalesApprovalsService)
      .compile();

      app = moduleFixture.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      
      // Register cookie plugin as in main.ts
      const cookiePlugin = (await import('@fastify/cookie')).default;
      await app.register(cookiePlugin);

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      jwtService = moduleFixture.get<JwtService>(JwtService);
      
      // We use 'secret' because MockJwtStrategy uses 'secret'.
      secret = 'secret';
    } catch (e) {
      console.error('Test Setup Failed:', e);
      throw e;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /sales/approvals/config', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/sales/approvals/config')
        .query({ documentKey: 'sales.order' })
        .expect(401);
    });

    it('should return 403 if missing permission', async () => {
      // Token without SALES.APPROVE
      const token = createMockToken(jwtService, secret, mockUserId, mockTenantId, []);
      mockUserPermissions = []; // Set permissions for this test
      
      await request(app.getHttpServer())
        .get('/sales/approvals/config')
        .query({ documentKey: 'sales.order' })
        .set('Cookie', [`access_token=${token}; active_tenant=${mockTenantId}`])
        .set('x-tenant-id', mockTenantId)
        .expect(403);
    });

    it('should return 200 and config if authorized', async () => {
      const token = createMockToken(jwtService, secret, mockUserId, mockTenantId, [PERMISSIONS.SALES.APPROVE]);
      mockUserPermissions = [PERMISSIONS.SALES.APPROVE];

      await request(app.getHttpServer())
        .get('/sales/approvals/config')
        .query({ documentKey: 'sales.order' })
        .set('Cookie', [`access_token=${token}; active_tenant=${mockTenantId}`])
        .set('x-tenant-id', mockTenantId)
        .expect(200);
    });
  });

  describe('PUT /sales/approvals/config', () => {
     it('should return 403 if missing UPDATE permission', async () => {
       const token = createMockToken(jwtService, secret, mockUserId, mockTenantId, [PERMISSIONS.SALES.APPROVE]);
       mockUserPermissions = [PERMISSIONS.SALES.APPROVE];
       
       await request(app.getHttpServer())
        .put('/sales/approvals/config')
        .send({
            documentKey: 'sales.order',
            levels: []
        })
        .set('Cookie', [`access_token=${token}; active_tenant=${mockTenantId}`])
        .set('x-tenant-id', mockTenantId)
        .expect(403);
     });

      it('should return 200 if authorized', async () => {
       const token = createMockToken(jwtService, secret, mockUserId, mockTenantId, [PERMISSIONS.SALES.APPROVE, PERMISSIONS.SALES.UPDATE]);
       mockUserPermissions = [PERMISSIONS.SALES.APPROVE, PERMISSIONS.SALES.UPDATE];
       
       await request(app.getHttpServer())
        .put('/sales/approvals/config')
        .send({
            documentKey: 'sales.order',
            levels: []
        })
        .set('Cookie', [`access_token=${token}; active_tenant=${mockTenantId}`])
        .set('x-tenant-id', mockTenantId)
        .expect(200);
     });
  });
});
