import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryRecordDto } from './dto/create-inventory-record.dto';
import { QueryInventoryRecordDto } from './dto/query-inventory-record.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建库存记录（入库/出库）
   */
  async createRecord(createInventoryRecordDto: CreateInventoryRecordDto, userId: number) {
    // 检查材料是否存在
    const material = await this.prisma.material.findUnique({
      where: { id: createInventoryRecordDto.materialId },
    });

    if (!material) {
      throw new NotFoundException('材料不存在');
    }

    // 计算新的库存数量
    let newStockQuantity = material.stock_quantity;
    if (createInventoryRecordDto.type === 'in') {
      newStockQuantity += createInventoryRecordDto.quantity;
    } else if (createInventoryRecordDto.type === 'out') {
      if (material.stock_quantity < createInventoryRecordDto.quantity) {
        throw new BadRequestException('库存不足');
      }
      newStockQuantity -= createInventoryRecordDto.quantity;
    }

    // 使用事务创建库存记录并更新材料库存
    const result = await this.prisma.$transaction(async (prisma) => {
      // 创建库存记录
      const record = await prisma.inventory_records.create({
        data: {
          materialId: createInventoryRecordDto.materialId,
          type: createInventoryRecordDto.type as any,
          quantity: createInventoryRecordDto.quantity,
          unitPrice: createInventoryRecordDto.unitPrice,
          totalPrice: createInventoryRecordDto.quantity * (createInventoryRecordDto.unitPrice || 0),
          operator_id: userId,
          remarks: createInventoryRecordDto.remarks,
        },
        include: {
          material: true,
          operator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });

      // 更新材料库存
      await prisma.material.update({
        where: { id: createInventoryRecordDto.materialId },
        data: {
          stock_quantity: newStockQuantity,
          updatedAt: new Date(),
        },
      });

      return record;
    });

    return result;
  }

  /**
   * 查询库存记录列表
   */
  async findAll(query: QueryInventoryRecordDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.materialId) {
      where.materialId = filters.materialId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.operatorId) {
      where.operator_id = filters.operatorId;
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // 查询数据
    const [records, total] = await Promise.all([
      this.prisma.inventory_records.findMany({
        where,
        skip,
        take: limit,
        include: {
          material: true,
          operator: {
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
      this.prisma.inventory_records.count({ where }),
    ]);

    return {
      data: records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个库存记录
   */
  async findOne(id: number) {
    const record = await this.prisma.inventory_records.findUnique({
      where: { id },
      include: {
        material: true,
        operator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('库存记录不存在');
    }

    return record;
  }

  /**
   * 获取库存统计
   */
  async getStatistics(materialId?: number, startDate?: string, endDate?: string) {
    const where: any = {};

    if (materialId) {
      where.materialId = materialId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalInQuantity,
      totalOutQuantity,
      totalInValue,
      totalOutValue,
    ] = await Promise.all([
      this.prisma.inventory_records.aggregate({
        where: { ...where, type: 'in' },
        _sum: { quantity: true },
      }),
      this.prisma.inventory_records.aggregate({
        where: { ...where, type: 'out' },
        _sum: { quantity: true },
      }),
      this.prisma.inventory_records.aggregate({
        where: { ...where, type: 'in' },
        _sum: { totalPrice: true },
      }),
      this.prisma.inventory_records.aggregate({
        where: { ...where, type: 'out' },
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      totalInQuantity: totalInQuantity._sum.quantity || 0,
      totalOutQuantity: totalOutQuantity._sum.quantity || 0,
      totalInValue: totalInValue._sum.totalPrice || 0,
      totalOutValue: totalOutValue._sum.totalPrice || 0,
    };
  }
}
