import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  username: string;
  userType: string;
  siteId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'concrete-plant-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // 验证用户是否存在且状态正常
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        site: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    return {
      userId: user.id,
      username: user.username,
      name: user.name,
      userType: user.userType,
      siteId: user.siteId,
      roleId: user.roleId,
      role: user.role,
      site: user.site,
    };
  }
}
