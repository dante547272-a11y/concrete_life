/**
 * Prisma Mock 工具函数
 * 用于测试中创建完整的 Prisma 客户端 mock
 */

export const createMockPrismaService = () => {
  const mockFindFirst = jest.fn();
  const mockFindUnique = jest.fn();
  const mockFindMany = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockCount = jest.fn();
  const mockAggregate = jest.fn();
  const mockGroupBy = jest.fn();
  const mockDeleteMany = jest.fn();
  const mockUpdateMany = jest.fn();

  const createTableMock = () => ({
    findFirst: mockFindFirst,
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    count: mockCount,
    aggregate: mockAggregate,
    groupBy: mockGroupBy,
    deleteMany: mockDeleteMany,
    updateMany: mockUpdateMany,
  });

  return {
    // 用户相关
    users: createTableMock(),
    
    // 站点相关
    sites: createTableMock(),
    
    // 订单相关
    orders: createTableMock(),
    
    // 生产相关
    production_batches: createTableMock(),
    
    // 配方相关
    recipes: createTableMock(),
    concrete_grades: createTableMock(),
    
    // 材料相关
    materials: createTableMock(),
    suppliers: createTableMock(),
    
    // 车辆相关
    vehicles: createTableMock(),
    drivers: createTableMock(),
    
    // 任务相关
    tasks: createTableMock(),
    
    // 质量相关
    quality_tests: createTableMock(),
    
    // 报警相关
    alarms: createTableMock(),
    alarm_rules: createTableMock(),
    
    // 日志相关
    logs: createTableMock(),
    
    // 配置相关
    system_config: createTableMock(),
    
    // 报表相关
    reports: createTableMock(),
    
    // 其他
    employees: createTableMock(),
    equipment: createTableMock(),
    
    // 事务支持
    $transaction: jest.fn((callback) => callback({
      users: createTableMock(),
      sites: createTableMock(),
      orders: createTableMock(),
      production_batches: createTableMock(),
      recipes: createTableMock(),
      materials: createTableMock(),
      vehicles: createTableMock(),
      tasks: createTableMock(),
    })),
    
    // 连接管理
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
};

export const resetMockPrismaService = (mockPrisma: any) => {
  Object.keys(mockPrisma).forEach((key) => {
    if (typeof mockPrisma[key] === 'object' && mockPrisma[key] !== null) {
      Object.keys(mockPrisma[key]).forEach((method) => {
        if (typeof mockPrisma[key][method]?.mockReset === 'function') {
          mockPrisma[key][method].mockReset();
        }
      });
    }
  });
};


