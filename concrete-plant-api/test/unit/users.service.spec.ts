import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      username: 'testuser',
      password: 'password123',
      name: '测试用户',
      email: 'test@example.com',
      phone: '13800138000',
      userType: 'operator',
      siteId: 1,
      roleId: 1,
      department: '生产部',
      position: '操作员',
    };

    const mockUser = {
      id: 1,
      ...createUserDto,
      password_hash: 'hashed_password',
      status: 'active',
      role: { id: 1, name: '操作员' },
      site: { id: 1, name: '站点1' },
    };

    it('should create user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result).not.toHaveProperty('password_hash');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'testuser',
          password_hash: 'hashed_password',
          status: 'active',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        '用户名已存在',
      );
    });

    it('should hash password before storing', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should not return password hash in result', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 1,
        username: 'user1',
        name: '用户1',
        password_hash: 'hashed_password',
        status: 'active',
        role: { id: 1, name: '操作员' },
        site: { id: 1, name: '站点1' },
      },
      {
        id: 2,
        username: 'user2',
        name: '用户2',
        password_hash: 'hashed_password',
        status: 'active',
        role: { id: 1, name: '操作员' },
        site: { id: 1, name: '站点1' },
      },
    ];

    it('should return paginated users without password hash', async () => {
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.not.objectContaining({ password_hash: expect.anything() }),
        ]),
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(result.data[0]).not.toHaveProperty('password_hash');
    });

    it('should filter by siteId', async () => {
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      await service.findAll(1, 10, 1);

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter by userType', async () => {
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      await service.findAll(1, 10, undefined, 'operator');

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_type: 'operator' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      await service.findAll(1, 10, undefined, undefined, 'active');

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('should calculate total pages correctly', async () => {
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.users.count.mockResolvedValue(25);

      const result = await service.findAll(1, 10);

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      name: '测试用户',
      password_hash: 'hashed_password',
      status: 'active',
      role: { id: 1, name: '操作员' },
      site: { id: 1, name: '站点1' },
    };

    it('should return user by id without password hash', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('update', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      password_hash: 'old_hashed_password',
      status: 'active',
    };

    const updateDto = {
      name: '更新用户',
      email: 'updated@example.com',
      phone: '13900139000',
      department: '管理部',
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        password_hash: 'old_hashed_password',
        role: { id: 1, name: '操作员' },
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('更新用户');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new username already exists', async () => {
      const dtoWithUsername = { ...updateDto, username: 'existinguser' };

      mockPrismaService.users.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 2, username: 'existinguser' });

      await expect(service.update(1, dtoWithUsername)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, dtoWithUsername)).rejects.toThrow(
        '用户名已存在',
      );
    });

    it('should hash new password when updating password', async () => {
      const dtoWithPassword = { ...updateDto, password: 'newpassword123' };
      const updatedUser = {
        ...mockUser,
        password_hash: 'new_hashed_password',
        role: { id: 1, name: '操作员' },
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue(updatedUser);

      await service.update(1, dtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('should allow updating same username', async () => {
      const dtoSameUsername = { ...updateDto, username: 'testuser' };
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        role: { id: 1, name: '操作员' },
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, dtoSameUsername);

      expect(result).toBeDefined();
      // Should not check for duplicate username
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      status: 'active',
    };

    it('should soft delete user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({
        ...mockUser,
        status: 'inactive',
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({ message: '用户已删除' });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'inactive',
          deleted_at: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('should activate inactive user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        status: 'inactive',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({
        ...mockUser,
        status: 'active',
      });

      const result = await service.toggleStatus(1);

      expect(result).toEqual({ message: '用户已启用' });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'active' },
      });
    });

    it('should deactivate active user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        status: 'active',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({
        ...mockUser,
        status: 'inactive',
      });

      const result = await service.toggleStatus(1);

      expect(result).toEqual({ message: '用户已禁用' });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'inactive' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.toggleStatus(999)).rejects.toThrow(NotFoundException);
    });
  });
});


