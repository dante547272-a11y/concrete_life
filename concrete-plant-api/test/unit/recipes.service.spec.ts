import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from '../../src/recipes/recipes.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('RecipesService', () => {
  let service: RecipesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    recipes: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    sites: {
      findUnique: jest.fn(),
    },
    concrete_grades: {
      findUnique: jest.fn(),
    },
    materials: {
      findMany: jest.fn(),
    },
    recipe_details: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRecipeDto = {
      siteId: 1,
      name: 'C30混凝土',
      code: 'C30-001',
      gradeId: 1,
      version: '1.0',
      status: 'draft',
      slump: 180,
      strength: 30,
      waterCementRatio: 0.45,
      totalWeight: 2400,
      details: [
        {
          materialId: 1,
          quantity: 350,
          tolerance: 5,
        },
        {
          materialId: 2,
          quantity: 700,
          tolerance: 10,
        },
      ],
      remarks: '测试配方',
    };

    const mockSite = { id: 1, name: '站点1' };
    const mockGrade = { id: 1, name: 'C30', code: 'C30' };
    const mockMaterials = [
      { id: 1, name: '水泥' },
      { id: 2, name: '砂' },
    ];

    const mockRecipe = {
      id: 1,
      ...createRecipeDto,
      site: mockSite,
      grade: mockGrade,
      details: createRecipeDto.details.map((d, i) => ({
        ...d,
        material: mockMaterials[i],
      })),
      creator: { id: 1, username: 'admin', name: '管理员' },
    };

    it('should create recipe successfully', async () => {
      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.concrete_grades.findUnique.mockResolvedValue(mockGrade);
      mockPrismaService.materials.findMany.mockResolvedValue(mockMaterials);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.recipes.create.mockResolvedValue(mockRecipe);
      mockPrismaService.recipe_details.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);

      const result = await service.create(createRecipeDto, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('C30混凝土');
      expect(mockPrismaService.recipes.findFirst).toHaveBeenCalledWith({
        where: {
          name: createRecipeDto.name,
          site_id: createRecipeDto.siteId,
        },
      });
    });

    it('should throw ConflictException when recipe name already exists', async () => {
      mockPrismaService.recipes.findFirst.mockResolvedValue({ id: 1, name: 'C30混凝土' });

      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        '配方名称已存在',
      );
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        '站点不存在',
      );
    });

    it('should throw NotFoundException when grade not found', async () => {
      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.concrete_grades.findUnique.mockResolvedValue(null);

      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        '混凝土等级不存在',
      );
    });

    it('should throw NotFoundException when some materials not found', async () => {
      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.concrete_grades.findUnique.mockResolvedValue(mockGrade);
      mockPrismaService.materials.findMany.mockResolvedValue([mockMaterials[0]]); // 只返回一个材料

      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createRecipeDto, 1)).rejects.toThrow(
        '部分材料不存在',
      );
    });

    it('should create recipe without details', async () => {
      const dtoWithoutDetails = {
        ...createRecipeDto,
        details: undefined,
      };

      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.concrete_grades.findUnique.mockResolvedValue(mockGrade);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.recipes.create.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);

      const result = await service.create(dtoWithoutDetails, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.recipe_details.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockRecipes = [
      {
        id: 1,
        name: 'C30混凝土',
        code: 'C30-001',
        status: 'published',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        creator: { id: 1, username: 'admin', name: '管理员' },
        _count: { details: 3 },
      },
    ];

    it('should return paginated recipes', async () => {
      mockPrismaService.recipes.findMany.mockResolvedValue(mockRecipes);
      mockPrismaService.recipes.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockRecipes,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by siteId', async () => {
      mockPrismaService.recipes.findMany.mockResolvedValue(mockRecipes);
      mockPrismaService.recipes.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, siteId: 1 });

      expect(mockPrismaService.recipes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter by name', async () => {
      mockPrismaService.recipes.findMany.mockResolvedValue(mockRecipes);
      mockPrismaService.recipes.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, name: 'C30' });

      expect(mockPrismaService.recipes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: { contains: 'C30' } }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.recipes.findMany.mockResolvedValue(mockRecipes);
      mockPrismaService.recipes.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'published' });

      expect(mockPrismaService.recipes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      site: { id: 1, name: '站点1' },
      grade: { id: 1, name: 'C30' },
      details: [],
      creator: { id: 1, username: 'admin', name: '管理员' },
    };

    it('should return recipe by id', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecipe);
      expect(mockPrismaService.recipes.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('配方不存在');
    });
  });

  describe('update', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      status: 'draft',
      site_id: 1,
    };

    const updateDto = {
      name: 'C30混凝土-更新',
      slump: 200,
      remarks: '更新备注',
    };

    it('should update recipe successfully', async () => {
      const updatedRecipe = {
        ...mockRecipe,
        ...updateDto,
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        details: [],
      };

      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.findFirst.mockResolvedValue(null);
      mockPrismaService.recipes.update.mockResolvedValue(updatedRecipe);

      const result = await service.update(1, updateDto, 1);

      expect(result).toEqual(updatedRecipe);
      expect(mockPrismaService.recipes.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when updating published recipe', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        status: 'published',
      });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        '已发布的配方不能修改，请创建新版本',
      );
    });

    it('should throw ConflictException when new name already exists', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.findFirst.mockResolvedValue({
        id: 2,
        name: updateDto.name,
      });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        '配方名称已存在',
      );
    });

    it('should throw NotFoundException when new grade not found', async () => {
      const dtoWithGrade = { ...updateDto, gradeId: 999 };

      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.concrete_grades.findUnique.mockResolvedValue(null);

      await expect(service.update(1, dtoWithGrade, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, dtoWithGrade, 1)).rejects.toThrow(
        '混凝土等级不存在',
      );
    });

    it('should allow archiving published recipe', async () => {
      const archiveDto = { status: 'archived' };
      const archivedRecipe = {
        ...mockRecipe,
        status: 'archived',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        details: [],
      };

      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        status: 'published',
      });
      mockPrismaService.recipes.update.mockResolvedValue(archivedRecipe);

      const result = await service.update(1, archiveDto, 1);

      expect(result.status).toBe('archived');
    });
  });

  describe('remove', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      status: 'draft',
    };

    it('should delete recipe successfully', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.update.mockResolvedValue({
        ...mockRecipe,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({ message: '配方已删除' });
      expect(mockPrismaService.recipes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting published recipe', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        status: 'published',
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow('已发布的配方不能删除');
    });
  });

  describe('publish', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      status: 'draft',
      details: [
        { id: 1, material_id: 1, quantity: 350 },
        { id: 2, material_id: 2, quantity: 700 },
      ],
    };

    it('should publish recipe successfully', async () => {
      const publishedRecipe = {
        ...mockRecipe,
        status: 'published',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        details: mockRecipe.details.map(d => ({
          ...d,
          material: { id: d.material_id, name: '材料' },
        })),
      };

      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.update.mockResolvedValue(publishedRecipe);

      const result = await service.publish(1, 1);

      expect(result.status).toBe('published');
      expect(mockPrismaService.recipes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'published' }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.publish(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when recipe already published', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        status: 'published',
      });

      await expect(service.publish(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.publish(1, 1)).rejects.toThrow('配方已发布');
    });

    it('should throw BadRequestException when recipe has no details', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        details: [],
      });

      await expect(service.publish(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.publish(1, 1)).rejects.toThrow(
        '配方没有配方明细，不能发布',
      );
    });
  });

  describe('archive', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      status: 'published',
    };

    it('should archive recipe successfully', async () => {
      const archivedRecipe = {
        ...mockRecipe,
        status: 'archived',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
      };

      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.recipes.update.mockResolvedValue(archivedRecipe);

      const result = await service.archive(1, 1);

      expect(result.status).toBe('archived');
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.archive(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('copy', () => {
    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      code: 'C30-001',
      version: '1.0',
      site_id: 1,
      grade_id: 1,
      status: 'published',
      slump: 180,
      strength: 30,
      water_cement_ratio: 0.45,
      total_weight: 2400,
      details: [
        { id: 1, material_id: 1, quantity: 350, tolerance: 5 },
        { id: 2, material_id: 2, quantity: 700, tolerance: 10 },
      ],
    };

    it('should copy recipe successfully', async () => {
      const copiedRecipe = {
        id: 2,
        name: 'C30混凝土 (v2.0)',
        version: '2.0',
        status: 'draft',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        details: mockRecipe.details.map(d => ({
          ...d,
          material: { id: d.material_id, name: '材料' },
        })),
      };

      mockPrismaService.recipes.findUnique
        .mockResolvedValueOnce(mockRecipe)
        .mockResolvedValueOnce(copiedRecipe);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.recipes.create.mockResolvedValue(copiedRecipe);
      mockPrismaService.recipe_details.createMany.mockResolvedValue({ count: 2 });

      const result = await service.copy(1, 1);

      expect(result).toBeDefined();
      expect(result.version).toBe('2.0');
      expect(result.status).toBe('draft');
      expect(mockPrismaService.recipes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: '2.0',
          status: 'draft',
        }),
      });
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.copy(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should increment major version correctly', async () => {
      const recipeV5 = { ...mockRecipe, version: '5.3' };
      const copiedRecipe = {
        id: 2,
        name: 'C30混凝土 (v6.0)',
        version: '6.0',
        status: 'draft',
        site: { id: 1, name: '站点1' },
        grade: { id: 1, name: 'C30' },
        details: [],
      };

      mockPrismaService.recipes.findUnique
        .mockResolvedValueOnce(recipeV5)
        .mockResolvedValueOnce(copiedRecipe);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.recipes.create.mockResolvedValue(copiedRecipe);

      const result = await service.copy(1, 1);

      expect(result.version).toBe('6.0');
    });
  });

  describe('getStatistics', () => {
    it('should return recipe statistics', async () => {
      mockPrismaService.recipes.count
        .mockResolvedValueOnce(10) // totalRecipes
        .mockResolvedValueOnce(3)  // draftRecipes
        .mockResolvedValueOnce(5)  // publishedRecipes
        .mockResolvedValueOnce(2); // archivedRecipes

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalRecipes: 10,
        draftRecipes: 3,
        publishedRecipes: 5,
        archivedRecipes: 2,
      });
    });

    it('should filter statistics by siteId', async () => {
      mockPrismaService.recipes.count.mockResolvedValue(5);

      await service.getStatistics(1);

      expect(mockPrismaService.recipes.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });
  });
});

