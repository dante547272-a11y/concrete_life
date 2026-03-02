import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipeDto } from './dto/query-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建配方
   */
  async create(createRecipeDto: CreateRecipeDto, userId: number) {
    // 检查配方名称是否已存在
    const existingRecipe = await this.prisma.recipes.findFirst({
      where: {
        name: createRecipeDto.name,
        siteId: createRecipeDto.siteId,
      },
    });

    if (existingRecipe) {
      throw new ConflictException('配方名称已存在');
    }

    // 检查站点是否存在
    const site = await this.prisma.site.findUnique({
      where: { id: createRecipeDto.siteId },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    // 检查混凝土等级是否存在
    if (createRecipeDto.gradeId) {
      const grade = await this.prisma.concrete_grades.findUnique({
        where: { id: createRecipeDto.gradeId },
      });

      if (!grade) {
        throw new NotFoundException('混凝土等级不存在');
      }
    }

    // 验证配方明细中的材料是否存在
    if (createRecipeDto.details && createRecipeDto.details.length > 0) {
      const materialIds = createRecipeDto.details.map(d => d.materialId);
      const materials = await this.prisma.material.findMany({
        where: { id: { in: materialIds } },
      });

      if (materials.length !== materialIds.length) {
        throw new NotFoundException('部分材料不存在');
      }
    }

    // 使用事务创建配方和配方明细
    const recipe = await this.prisma.$transaction(async (prisma) => {
      // 创建配方
      const newRecipe = await prisma.recipes.create({
        data: {
          siteId: createRecipeDto.siteId,
          name: createRecipeDto.name,
          code: createRecipeDto.code,
          grade_id: createRecipeDto.gradeId,
          version: createRecipeDto.version || '1.0',
          status: (createRecipeDto.status as any) || 'draft',
          slump: createRecipeDto.slump,
          strength: createRecipeDto.strength,
          water_cement_ratio: createRecipeDto.waterCementRatio,
          total_weight: createRecipeDto.totalWeight,
          remarks: createRecipeDto.remarks,
          created_by: userId,
        },
      });

      // 创建配方明细
      if (createRecipeDto.details && createRecipeDto.details.length > 0) {
        await prisma.recipe_details.createMany({
          data: createRecipeDto.details.map(detail => ({
            recipeId: newRecipe.id,
            materialId: detail.materialId,
            quantity: detail.quantity,
            tolerance: detail.tolerance || 0,
            remarks: detail.remarks,
          })),
        });
      }

      // 返回完整的配方信息
      return prisma.recipes.findUnique({
        where: { id: newRecipe.id },
        include: {
          site: true,
          grade: true,
          details: {
            include: {
              material: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });
    });

    return recipe;
  }

  /**
   * 查询配方列表
   */
  async findAll(query: QueryRecipeDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.name) {
      where.name = { contains: filters.name };
    }

    if (filters.code) {
      where.code = { contains: filters.code };
    }

    if (filters.gradeId) {
      where.grade_id = filters.gradeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // 查询数据
    const [recipes, total] = await Promise.all([
      this.prisma.recipes.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: true,
          grade: true,
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          _count: {
            select: {
              details: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.recipes.count({ where }),
    ]);

    return {
      data: recipes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个配方
   */
  async findOne(id: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
      include: {
        site: true,
        grade: true,
        details: {
          include: {
            material: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    return recipe;
  }

  /**
   * 更新配方
   */
  async update(id: number, updateRecipeDto: UpdateRecipeDto, userId: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    // 如果配方已发布，不允许修改
    if (recipe.status === 'published' && updateRecipeDto.status !== 'archived') {
      throw new BadRequestException('已发布的配方不能修改，请创建新版本');
    }

    // 如果修改名称，检查是否重复
    if (updateRecipeDto.name && updateRecipeDto.name !== recipe.name) {
      const existingRecipe = await this.prisma.recipes.findFirst({
        where: {
          name: updateRecipeDto.name,
          siteId: recipe.siteId,
          id: { not: id },
        },
      });

      if (existingRecipe) {
        throw new ConflictException('配方名称已存在');
      }
    }

    // 如果修改混凝土等级，检查等级是否存在
    if (updateRecipeDto.gradeId) {
      const grade = await this.prisma.concrete_grades.findUnique({
        where: { id: updateRecipeDto.gradeId },
      });

      if (!grade) {
        throw new NotFoundException('混凝土等级不存在');
      }
    }

    // 更新配方
    const updatedRecipe = await this.prisma.recipes.update({
      where: { id },
      data: {
        name: updateRecipeDto.name,
        code: updateRecipeDto.code,
        grade_id: updateRecipeDto.gradeId,
        version: updateRecipeDto.version,
        status: updateRecipeDto.status as any,
        slump: updateRecipeDto.slump,
        strength: updateRecipeDto.strength,
        water_cement_ratio: updateRecipeDto.waterCementRatio,
        total_weight: updateRecipeDto.totalWeight,
        remarks: updateRecipeDto.remarks,
        updatedAt: new Date(),
      },
      include: {
        site: true,
        grade: true,
        details: {
          include: {
            material: true,
          },
        },
      },
    });

    return updatedRecipe;
  }

  /**
   * 删除配方
   */
  async remove(id: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    // 如果配方已发布，不允许删除
    if (recipe.status === 'published') {
      throw new BadRequestException('已发布的配方不能删除');
    }

    await this.prisma.recipes.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: '配方已删除' };
  }

  /**
   * 发布配方
   */
  async publish(id: number, userId: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
      include: {
        details: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    if (recipe.status === 'published') {
      throw new BadRequestException('配方已发布');
    }

    if (!recipe.details || recipe.details.length === 0) {
      throw new BadRequestException('配方没有配方明细，不能发布');
    }

    const publishedRecipe = await this.prisma.recipes.update({
      where: { id },
      data: {
        status: 'published',
        updatedAt: new Date(),
      },
      include: {
        site: true,
        grade: true,
        details: {
          include: {
            material: true,
          },
        },
      },
    });

    return publishedRecipe;
  }

  /**
   * 归档配方
   */
  async archive(id: number, userId: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    const archivedRecipe = await this.prisma.recipes.update({
      where: { id },
      data: {
        status: 'archived',
        updatedAt: new Date(),
      },
      include: {
        site: true,
        grade: true,
      },
    });

    return archivedRecipe;
  }

  /**
   * 复制配方（创建新版本）
   */
  async copy(id: number, userId: number) {
    const recipe = await this.prisma.recipes.findUnique({
      where: { id },
      include: {
        details: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }

    // 生成新版本号
    const versionParts = recipe.version.split('.');
    const majorVersion = parseInt(versionParts[0]);
    const newVersion = `${majorVersion + 1}.0`;

    // 创建新配方
    const newRecipe = await this.prisma.$transaction(async (prisma) => {
      const copiedRecipe = await prisma.recipes.create({
        data: {
          siteId: recipe.siteId,
          name: `${recipe.name} (v${newVersion})`,
          code: recipe.code,
          grade_id: recipe.grade_id,
          version: newVersion,
          status: 'draft',
          slump: recipe.slump,
          strength: recipe.strength,
          water_cement_ratio: recipe.water_cement_ratio,
          total_weight: recipe.total_weight,
          remarks: `复制自配方 ${recipe.name} (v${recipe.version})`,
          created_by: userId,
        },
      });

      // 复制配方明细
      if (recipe.details && recipe.details.length > 0) {
        await prisma.recipe_details.createMany({
          data: recipe.details.map(detail => ({
            recipeId: copiedRecipe.id,
            materialId: detail.materialId,
            quantity: detail.quantity,
            tolerance: detail.tolerance,
            remarks: detail.remarks,
          })),
        });
      }

      return prisma.recipes.findUnique({
        where: { id: copiedRecipe.id },
        include: {
          site: true,
          grade: true,
          details: {
            include: {
              material: true,
            },
          },
        },
      });
    });

    return newRecipe;
  }

  /**
   * 获取配方统计
   */
  async getStatistics(siteId?: number) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    const [
      totalRecipes,
      draftRecipes,
      publishedRecipes,
      archivedRecipes,
    ] = await Promise.all([
      this.prisma.recipes.count({ where }),
      this.prisma.recipes.count({ where: { ...where, status: 'draft' } }),
      this.prisma.recipes.count({ where: { ...where, status: 'published' } }),
      this.prisma.recipes.count({ where: { ...where, status: 'archived' } }),
    ]);

    return {
      totalRecipes,
      draftRecipes,
      publishedRecipes,
      archivedRecipes,
    };
  }
}
