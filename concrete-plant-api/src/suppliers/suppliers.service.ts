import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建供应商
   */
  async create(createSupplierDto: CreateSupplierDto, userId: number) {
    // 检查供应商名称是否已存在
    const existingSupplier = await this.prisma.suppliers.findFirst({
      where: {
        name: createSupplierDto.name,
      },
    });

    if (existingSupplier) {
      throw new ConflictException('供应商名称已存在');
    }

    // 创建供应商
    const supplier = await this.prisma.suppliers.create({
      data: {
        name: createSupplierDto.name,
        contact_person: createSupplierDto.contactPerson,
        phone: createSupplierDto.phone,
        email: createSupplierDto.email,
        address: createSupplierDto.address,
        type: createSupplierDto.type as any,
        credit_rating: createSupplierDto.creditRating,
        remarks: createSupplierDto.remarks,
        created_by: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return supplier;
  }

  /**
   * 查询供应商列表
   */
  async findAll(query: QuerySupplierDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.name) {
      where.name = { contains: filters.name };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.creditRating) {
      where.credit_rating = filters.creditRating;
    }

    // 查询数据
    const [suppliers, total] = await Promise.all([
      this.prisma.suppliers.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          _count: {
            select: {
              materials: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.suppliers.count({ where }),
    ]);

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个供应商
   */
  async findOne(id: number) {
    const supplier = await this.prisma.suppliers.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        materials: {
          include: {
            site: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    return supplier;
  }

  /**
   * 更新供应商
   */
  async update(id: number, updateSupplierDto: UpdateSupplierDto, userId: number) {
    const supplier = await this.prisma.suppliers.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    // 如果修改名称，检查是否重复
    if (updateSupplierDto.name && updateSupplierDto.name !== supplier.name) {
      const existingSupplier = await this.prisma.suppliers.findFirst({
        where: {
          name: updateSupplierDto.name,
          id: { not: id },
        },
      });

      if (existingSupplier) {
        throw new ConflictException('供应商名称已存在');
      }
    }

    // 更新供应商
    const updatedSupplier = await this.prisma.suppliers.update({
      where: { id },
      data: {
        name: updateSupplierDto.name,
        contact_person: updateSupplierDto.contactPerson,
        phone: updateSupplierDto.phone,
        email: updateSupplierDto.email,
        address: updateSupplierDto.address,
        type: updateSupplierDto.type as any,
        credit_rating: updateSupplierDto.creditRating,
        remarks: updateSupplierDto.remarks,
        updatedAt: new Date(),
      },
    });

    return updatedSupplier;
  }

  /**
   * 删除供应商
   */
  async remove(id: number) {
    const supplier = await this.prisma.suppliers.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            materials: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    // 检查是否有关联的材料
    if (supplier._count.materials > 0) {
      throw new ConflictException('该供应商有关联的材料，不能删除');
    }

    await this.prisma.suppliers.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: '供应商已删除' };
  }

  /**
   * 获取供应商统计
   */
  async getStatistics() {
    const [
      totalSuppliers,
      suppliersByType,
      suppliersByCreditRating,
    ] = await Promise.all([
      this.prisma.suppliers.count(),
      this.prisma.suppliers.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.suppliers.groupBy({
        by: ['credit_rating'],
        _count: true,
      }),
    ]);

    return {
      totalSuppliers,
      suppliersByType,
      suppliersByCreditRating,
    };
  }
}
