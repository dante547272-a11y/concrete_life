import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        site: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT Token
    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      siteId: user.siteId,
    };

    const accessToken = this.jwtService.sign(payload);

    // 记录登录日志
    await this.createLoginLog(user.id, 'success');

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
        siteId: user.siteId,
        roleId: user.roleId,
        role: user.role,
        site: user.site,
      },
    };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    const { username, password, name, email, phone, userType, siteId, roleId } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查站点是否存在
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new ConflictException('站点不存在');
    }

    // 如果提供了角色ID，检查角色是否存在
    if (roleId) {
      const role = await this.prisma.roles.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new ConflictException('角色不存在');
      }
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
        status: 'active',
      },
      include: {
        role: true,
        site: true,
      },
    });

    // 生成 JWT Token
    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      siteId: user.siteId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        siteId: user.siteId,
        roleId: user.roleId,
        role: user.role,
        site: user.site,
      },
    };
  }

  /**
   * 验证 Token
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: true,
          site: true,
        },
      });

      if (!user || user.status !== 'active') {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        userType: user.userType,
        siteId: user.siteId,
        roleId: user.roleId,
        role: user.role,
        site: user.site,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  /**
   * 记录登录日志
   */
  private async createLoginLog(userId: number, result: 'success' | 'failure') {
    try {
      await this.prisma.operation_logs.create({
        data: {
          operator_id: userId,
          module: 'auth',
          action: 'login',
          target: 'system',
          detail: `用户登录${result === 'success' ? '成功' : '失败'}`,
          result: result,
          siteId: 1, // 默认站点，实际应该从用户信息获取
        },
      });
    } catch (error) {
      // 日志记录失败不影响登录流程
      console.error('记录登录日志失败:', error);
    }
  }
}
