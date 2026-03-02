import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { QueryGradeDto } from './dto/query-grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建混凝土等级
   */
  async create(createGradeDto: CreateGradeDto, userId: number) {
    // 检查等级名称是否已存在
    const existingGrade = await this.prisma.concrete_grades.findFirst({
      where: {
        name: createGradeDto.name,
      },
    });

    if (existingGrade) {
      throw new ConflictException('混凝土等级已存在');
    }

    // 创建等级
    const grade = await this.prisma.concrete_grades.create({
      data: {
        name: createGradeDto.name,
        code: createGradeDto.code,
        strength: createGradeDto.strength,
        price: createGradeDto.price,
        description: createGradeDto.description,
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

    return grade;
  }

  /**
   * 查询等级列表
   */
  async findAll(query: QueryGradeDto) {
    const { page = 1, limit = 10, sortBy = 'strength', sortOrder = 'asc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.name) {
      where.name = { contains: filters.name };
    }

    if (filters.code) {
      where.code = { contains: filters.code };
    }

    // 查询数据
    const [grades, total] = await Promise.all([
      this.prisma.concrete_grades.findMany({
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
              recipes: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.concrete_grades.count({ where }),
    ]);

    return {
      data: grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个等级
   */
  async findOne(id: number) {
    const grade = await this.prisma.concrete_grades.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        recipes: {
          where: {
            status: 'published',
          },
          include: {
            site: true,
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('混凝土等级不存在');
    }

    return grade;
  }

  /**
   * 更新等级
   */
  async update(id: number, updateGradeDto: UpdateGradeDto, userId: number) {
    const grade = await this.prisma.concrete_grades.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException('混凝土等级不存在');
    }

    // 如果修改名称，检查是否重复
    if (updateGradeDto.name && updateGradeDto.name !== grade.name) {
      const existingGrade = await this.prisma.concrete_grades.findFirst({
        where: {
          name: updateGradeDto.name,
          id: { not: id },
        },
      });

      if (existingGrade) {
        throw new ConflictException('混凝土等级已存在');
      }
    }

    // 更新等级
    const updatedGrade = await this.prisma.concrete_grades.update({
      where: { id },
      data: {
        name: updateGradeDto.name,
        code: updateGradeDto.code,
        strength: updateGradeDto.strength,
        price: updateGradeDto.price,
        description: updateGradeDto.description,
        updatedAt: new Date(),
      },
    });

    return updatedGrade;
  }

  /**
   * 删除等级
   */
  async remove(id: number) {
    const grade = await this.prisma.concrete_grades.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipes: true,
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('混凝土等级不存在');
    }

    // 检查是否有关联的配方
    if (grade._count.recipes > 0) {
      throw new ConflictException('该等级有关联的配方，不能删除');
    }

    await this.prisma.concrete_grades.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: '混凝土等级已删除' };
  }

  /**
   * 获取等级统计
   */
  async getStatistics() {
    const [totalGrades, gradesWithRecipes] = await Promise.all([
      this.prisma.concrete_grades.count(),
      this.prisma.concrete_grades.count({
        where: {
          recipes: {
            some: {},
          },
        },
      }),
    ]);

    return {
      totalGrades,
      gradesWithRecipes,
      gradesWithoutRecipes: totalGrades - gradesWithRecipes,
    };
  }
}
