import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建原材料
   */
  async create(createMaterialDto: CreateMaterialDto, userId: number) {
    // 检查材料名称是否已存在
    const existingMaterial = await this.prisma.material.findFirst({
      where: {
        name: createMaterialDto.name,
        siteId: createMaterialDto.siteId,
      },
    });

    if (existingMaterial) {
      throw new ConflictException('材料名称已存在');
    }

    // 检查站点是否存在
    const site = await this.prisma.site.findUnique({
      where: { id: createMaterialDto.siteId },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    // 如果指定了供应商，检查供应商是否存在
    if (createMaterialDto.supplierId) {
      const supplier = await this.prisma.suppliers.findUnique({
        where: { id: createMaterialDto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('供应商不存在');
      }
    }

    // 创建材料
    const material = await this.prisma.material.create({
      data: {
        siteId: createMaterialDto.siteId,
        name: createMaterialDto.name,
        type: createMaterialDto.type as any,
        unit: createMaterialDto.unit,
        price: createMaterialDto.price,
        stock_quantity: createMaterialDto.stockQuantity || 0,
        minStock: createMaterialDto.minStock || 0,
        maxStock: createMaterialDto.maxStock,
        supplierId: createMaterialDto.supplierId,
        specifications: createMaterialDto.specifications,
        remarks: createMaterialDto.remarks,
        created_by: userId,
      },
      include: {
        site: true,
        supplier: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return material;
  }

  /**
   * 查询材料列表
   */
  async findAll(query: QueryMaterialDto) {
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

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.lowStock) {
      // 查询库存低于最小库存的材料
      where.AND = [
        {
          stock_quantity: {
            lte: where.minStock || 0,
          },
        },
      ];
    }

    // 查询数据
    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: true,
          supplier: true,
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data: materials,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个材料
   */
  async findOne(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        site: true,
        supplier: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        inventory_records: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            operator: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('材料不存在');
    }

    return material;
  }

  /**
   * 更新材料
   */
  async update(id: number, updateMaterialDto: UpdateMaterialDto, userId: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('材料不存在');
    }

    // 如果修改名称，检查是否重复
    if (updateMaterialDto.name && updateMaterialDto.name !== material.name) {
      const existingMaterial = await this.prisma.material.findFirst({
        where: {
          name: updateMaterialDto.name,
          siteId: material.siteId,
          id: { not: id },
        },
      });

      if (existingMaterial) {
        throw new ConflictException('材料名称已存在');
      }
    }

    // 如果修改供应商，检查供应商是否存在
    if (updateMaterialDto.supplierId) {
      const supplier = await this.prisma.suppliers.findUnique({
        where: { id: updateMaterialDto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('供应商不存在');
      }
    }

    // 更新材料
    const updatedMaterial = await this.prisma.material.update({
      where: { id },
      data: {
        name: updateMaterialDto.name,
        type: updateMaterialDto.type as any,
        unit: updateMaterialDto.unit,
        price: updateMaterialDto.price,
        minStock: updateMaterialDto.minStock,
        maxStock: updateMaterialDto.maxStock,
        supplierId: updateMaterialDto.supplierId,
        specifications: updateMaterialDto.specifications,
        remarks: updateMaterialDto.remarks,
        updatedAt: new Date(),
      },
      include: {
        site: true,
        supplier: true,
      },
    });

    return updatedMaterial;
  }

  /**
   * 删除材料
   */
  async remove(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('材料不存在');
    }

    // 检查是否有库存
    if (material.stock_quantity > 0) {
      throw new BadRequestException('有库存的材料不能删除');
    }

    await this.prisma.material.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: '材料已删除' };
  }

  /**
   * 获取材料统计
   */
  async getStatistics(siteId?: number) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    const [
      totalMaterials,
      lowStockMaterials,
      outOfStockMaterials,
      totalValue,
      allMaterials,
    ] = await Promise.all([
      this.prisma.material.count({ where }),
      // 先获取所有材料，然后在内存中过滤低库存
      this.prisma.material.findMany({ where, select: { stock_quantity: true, minStock: true } }),
      this.prisma.material.count({
        where: {
          ...where,
          stock_quantity: 0,
        },
      }),
      this.prisma.material.count({
        where: {
          ...where,
          stock_quantity: 0,
        },
      }),
      this.prisma.material.aggregate({
        where,
        _sum: {
          stock_quantity: true,
        },
      }),
      this.prisma.material.findMany({ where }),
    ]);

    // 在内存中计算低库存材料数量
    const lowStockCount = allMaterials.filter(m => m.stock_quantity <= m.minStock).length;

    return {
      totalMaterials,
      lowStockMaterials: lowStockCount,
      outOfStockMaterials,
      totalStockQuantity: totalValue._sum.stock_quantity || 0,
    };
  }

  /**
   * 获取低库存材料列表
   */
  async getLowStockMaterials(siteId?: number) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    // 获取所有材料，然后在内存中过滤
    const allMaterials = await this.prisma.material.findMany({
      where,
      include: {
        site: true,
        supplier: true,
      },
    });

    // 过滤出库存低于最小库存的材料
    const lowStockMaterials = allMaterials
      .filter(m => m.stock_quantity <= m.minStock)
      .sort((a, b) => a.stock_quantity - b.stock_quantity);

    return lowStockMaterials;
  }
}
