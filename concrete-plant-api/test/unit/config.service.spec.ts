import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../../src/config/config.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaService;

  const mockPrismaService = {
    system_configs: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const mockConfigs = [
      { key: 'system.name', value: '系统名称', category: 'system' },
      { key: 'system.version', value: '1.0.0', category: 'system' },
      { key: 'business.timeout', value: '3600', category: 'business' },
    ];

    it('should return grouped configs', async () => {
      mockPrismaService.system_configs.findMany.mockResolvedValue(mockConfigs);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result.system).toHaveLength(2);
      expect(result.business).toHaveLength(1);
    });

    it('should filter by category', async () => {
      mockPrismaService.system_configs.findMany.mockResolvedValue([mockConfigs[0], mockConfigs[1]]);

      await service.findAll('system');

      expect(mockPrismaService.system_configs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'system' },
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockConfig = {
      key: 'system.name',
      value: '系统名称',
      category: 'system',
    };

    it('should return config by key', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(mockConfig);

      const result = await service.findOne('system.name');

      expect(result).toEqual(mockConfig);
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid.key')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getValue', () => {
    it('should return parsed JSON value', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue({
        key: 'test.json',
        value: '{"enabled": true}',
      });

      const result = await service.getValue('test.json');

      expect(result).toEqual({ enabled: true });
    });

    it('should return string value when not JSON', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue({
        key: 'test.string',
        value: 'simple string',
      });

      const result = await service.getValue('test.string');

      expect(result).toBe('simple string');
    });
  });

  describe('create', () => {
    const createDto = {
      key: 'new.config',
      value: 'test value',
      category: 'test',
      description: '测试配置',
      isPublic: false,
    };

    it('should create config successfully', async () => {
      const mockConfig = { id: 1, ...createDto };
      mockPrismaService.system_configs.create.mockResolvedValue(mockConfig);

      const result = await service.create(createDto, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.system_configs.create).toHaveBeenCalled();
    });

    it('should stringify object values', async () => {
      const dtoWithObject = { ...createDto, value: { enabled: true } };
      mockPrismaService.system_configs.create.mockResolvedValue({});

      await service.create(dtoWithObject, 1);

      expect(mockPrismaService.system_configs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          value: '{"enabled":true}',
        }),
      });
    });
  });

  describe('update', () => {
    const mockConfig = {
      key: 'test.config',
      value: 'old value',
    };

    it('should update config successfully', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.system_configs.update.mockResolvedValue({
        ...mockConfig,
        value: 'new value',
      });

      const result = await service.update('test.config', { value: 'new value' }, 1);

      expect(result.value).toBe('new value');
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid.key', { value: 'test' }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete config successfully', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue({ key: 'test.config' });
      mockPrismaService.system_configs.delete.mockResolvedValue({});

      const result = await service.remove('test.config');

      expect(result).toEqual({ message: '配置删除成功' });
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid.key')).rejects.toThrow(NotFoundException);
    });
  });

  describe('batchUpdate', () => {
    it('should update multiple configs', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue({ key: 'test' });
      mockPrismaService.system_configs.update.mockResolvedValue({});

      const configs = [
        { key: 'config1', value: 'value1' },
        { key: 'config2', value: 'value2' },
      ];

      const result = await service.batchUpdate(configs, 1);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(true);
    });

    it('should handle errors in batch update', async () => {
      mockPrismaService.system_configs.findUnique
        .mockResolvedValueOnce({ key: 'config1' })
        .mockResolvedValueOnce(null);
      mockPrismaService.system_configs.update.mockResolvedValue({});

      const configs = [
        { key: 'config1', value: 'value1' },
        { key: 'invalid', value: 'value2' },
      ];

      const result = await service.batchUpdate(configs, 1);

      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
    });
  });

  describe('getPublicConfigs', () => {
    it('should return only public configs', async () => {
      mockPrismaService.system_configs.findMany.mockResolvedValue([
        { key: 'public1', value: 'value1', category: 'system', description: '' },
        { key: 'public2', value: '{"enabled":true}', category: 'system', description: '' },
      ]);

      const result = await service.getPublicConfigs();

      expect(result.public1).toBe('value1');
      expect(result.public2).toEqual({ enabled: true });
    });
  });

  describe('initializeDefaultConfigs', () => {
    it('should create default configs', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue(null);
      mockPrismaService.system_configs.create.mockResolvedValue({});

      const result = await service.initializeDefaultConfigs();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].action).toBe('created');
    });

    it('should skip existing configs', async () => {
      mockPrismaService.system_configs.findUnique.mockResolvedValue({ key: 'existing' });

      const result = await service.initializeDefaultConfigs();

      expect(result[0].action).toBe('skipped');
    });
  });
});


