import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto) {
    const { username, password, name, email, phone, userType, siteId, roleId, department, position } = createUserDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        name,
        email,
        phone,
        userType: userType as any,
        siteId: siteId,
        roleId: roleId,
        department,
        position,
        status: 'active',
      },
      include: {
        role: true,
        site: true,
      },
    });

    // 不返回密码哈希
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * 查询所有用户
   */
  async findAll(page: number = 1, limit: number = 10, siteId?: number, userType?: string, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (siteId) where.siteId = siteId;
    if (userType) where.userType = userType;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          site: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 不返回密码哈希
    const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);

    return {
      data: usersWithoutPassword,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个用户
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        site: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不返回密码哈希
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * 更新用户
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果要更新用户名，检查是否已存在
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 如果要更新密码，加密密码
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username,
        passwordHash: passwordHash,
        name: updateUserDto.name,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        userType: updateUserDto.userType as any,
        siteId: updateUserDto.siteId,
        roleId: updateUserDto.roleId,
        department: updateUserDto.department,
        position: updateUserDto.position,
        avatar: updateUserDto.avatar,
        status: updateUserDto.status as any,
      },
      include: {
        role: true,
        site: true,
      },
    });

    // 不返回密码哈希
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  /**
   * 删除用户（软删除）
   */
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });

    return { message: '用户已删除' };
  }

  /**
   * 启用/禁用用户
   */
  async toggleStatus(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    return { message: `用户已${newStatus === 'active' ? '启用' : '禁用'}` };
  }
}
