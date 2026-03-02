import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        NODE_ENV: 'test',
        PORT: 3000,
        DATABASE_TYPE: 'postgres',
        DEPLOYMENT_MODE: 'hybrid',
        PLC_HOST: 'localhost',
        CLOUD_API_URL: 'https://api.example.com',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('health endpoints', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('should return API health status', () => {
      const result = appController.getApiHealth();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
    });
  });

  describe('runtime config', () => {
    it('should return runtime configuration', () => {
      const result = appController.getRuntimeConfig();
      expect(result).toBeDefined();
      expect(result.mode).toBe('hybrid');
      expect(result.features).toBeDefined();
      expect(result.database).toBe('postgres');
      expect(result.plc).toBeDefined();
      expect(result.cloudSync).toBeDefined();
    });
  });
});
