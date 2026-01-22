import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始初始化数据库...');

  try {
    // 1. 创建默认站点
    console.log('📍 创建默认站点...');
    const sites = await prisma.site.createMany({
      data: [
        {
          name: '杭州总站',
          code: 'HZ001',
          address: '浙江省杭州市余杭区良渚街道',
          status: 'active',
          manager: '张三',
          phone: '13800138001',
        },
        {
          name: '宁波分站',
          code: 'NB001',
          address: '浙江省宁波市鄞州区',
          status: 'active',
          manager: '李四',
          phone: '13800138002',
        },
        {
          name: '温州分站',
          code: 'WZ001',
          address: '浙江省温州市龙湾区',
          status: 'active',
          manager: '王五',
          phone: '13800138003',
        },
      ],
      skipDuplicates: true,
    });

    // 2. 创建默认角色
    console.log('👥 创建默认角色...');
    const roles = await prisma.role.createMany({
      data: [
        {
          name: '超级管理员',
          description: '系统超级管理员，拥有所有权限',
          permissions: JSON.stringify(['*']),
        },
        {
          name: '站点管理员',
          description: '站点管理员，管理单个站点的所有业务',
          permissions: JSON.stringify(['site.*']),
        },
        {
          name: '生产操作员',
          description: '生产操作员，负责生产控制和质量检测',
          permissions: JSON.stringify(['production.*', 'quality.*']),
        },
        {
          name: '调度员',
          description: '调度员，负责订单和任务管理',
          permissions: JSON.stringify(['order.*', 'task.*', 'queue.*']),
        },
        {
          name: '司机',
          description: '司机，查看自己的任务和排队信息',
          permissions: JSON.stringify(['task.view', 'queue.view']),
        },
      ],
      skipDuplicates: true,
    });

    // 3. 创建默认管理员用户
    console.log('👤 创建默认管理员用户...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash,
        email: 'admin@example.com',
        phone: '13800138000',
        name: '系统管理员',
        userType: 'admin',
        status: 'active',
        siteId: 1, // 杭州总站
      },
    });

    // 4. 创建数据字典
    console.log('📚 创建数据字典...');
    const dictionaries = await prisma.dictionary.createMany({
      data: [
        // 用户类型
        { category: 'user_type', code: 'admin', name: '管理员', value: 'admin', sortOrder: 1, description: '系统管理员' },
        { category: 'user_type', code: 'operator', name: '操作员', value: 'operator', sortOrder: 2, description: '生产操作员' },
        { category: 'user_type', code: 'driver', name: '司机', value: 'driver', sortOrder: 3, description: '车辆司机' },
        { category: 'user_type', code: 'quality', name: '质检员', value: 'quality', sortOrder: 4, description: '质量检测员' },
        { category: 'user_type', code: 'manager', name: '经理', value: 'manager', sortOrder: 5, description: '部门经理' },
        
        // 设备类型
        { category: 'equipment_type', code: 'vehicle', name: '车辆', value: 'vehicle', sortOrder: 1, description: '搅拌车等车辆' },
        { category: 'equipment_type', code: 'mixer', name: '搅拌机', value: 'mixer', sortOrder: 2, description: '混凝土搅拌机' },
        { category: 'equipment_type', code: 'conveyor', name: '输送带', value: 'conveyor', sortOrder: 3, description: '皮带输送机' },
        { category: 'equipment_type', code: 'silo', name: '料仓', value: 'silo', sortOrder: 4, description: '水泥仓、骨料仓等' },
        { category: 'equipment_type', code: 'scale', name: '秤', value: 'scale', sortOrder: 5, description: '各种计量秤' },
        
        // 原材料类型
        { category: 'material_type', code: 'aggregate', name: '骨料', value: 'aggregate', sortOrder: 1, description: '砂石骨料' },
        { category: 'material_type', code: 'cement', name: '粉料', value: 'cement', sortOrder: 2, description: '水泥、矿粉等' },
        { category: 'material_type', code: 'additive', name: '外加剂', value: 'additive', sortOrder: 3, description: '减水剂等外加剂' },
        { category: 'material_type', code: 'water', name: '水', value: 'water', sortOrder: 4, description: '拌合用水' },
      ],
      skipDuplicates: true,
    });

    // 5. 创建默认混凝土等级
    console.log('🏗️ 创建默认混凝土等级...');
    const concreteGrades = await prisma.concreteGrade.createMany({
      data: [
        {
          grade: 'C15',
          strengthClass: '15MPa',
          description: '低强度混凝土，适用于垫层等',
          slumpRange: '30-50mm',
          applications: JSON.stringify(['垫层', '基础填充']),
          pricePerCubic: 280.0,
          siteId: 1,
        },
        {
          grade: 'C20',
          strengthClass: '20MPa',
          description: '普通强度混凝土',
          slumpRange: '50-90mm',
          applications: JSON.stringify(['一般建筑', '道路']),
          pricePerCubic: 320.0,
          siteId: 1,
        },
        {
          grade: 'C25',
          strengthClass: '25MPa',
          description: '中等强度混凝土',
          slumpRange: '50-90mm',
          applications: JSON.stringify(['住宅建筑', '小型构件']),
          pricePerCubic: 350.0,
          siteId: 1,
        },
        {
          grade: 'C30',
          strengthClass: '30MPa',
          description: '常用强度混凝土',
          slumpRange: '160-200mm',
          applications: JSON.stringify(['高层建筑', '桥梁']),
          pricePerCubic: 380.0,
          siteId: 1,
        },
        {
          grade: 'C35',
          strengthClass: '35MPa',
          description: '高强度混凝土',
          slumpRange: '160-200mm',
          applications: JSON.stringify(['高层建筑', '预制构件']),
          pricePerCubic: 420.0,
          siteId: 1,
        },
        {
          grade: 'C40',
          strengthClass: '40MPa',
          description: '高强度混凝土',
          slumpRange: '160-200mm',
          applications: JSON.stringify(['超高层建筑', '重要结构']),
          pricePerCubic: 450.0,
          siteId: 1,
        },
      ],
      skipDuplicates: true,
    });

    // 6. 创建默认原材料
    console.log('🧱 创建默认原材料...');
    const materials = await prisma.material.createMany({
      data: [
        // 骨料
        { name: '碎石5-25mm', type: 'aggregate', specification: '5-25mm', unit: '吨', supplier: '杭州石料厂', lowThreshold: 50.0, siteId: 1 },
        { name: '碎石5-16mm', type: 'aggregate', specification: '5-16mm', unit: '吨', supplier: '杭州石料厂', lowThreshold: 30.0, siteId: 1 },
        { name: '河砂', type: 'aggregate', specification: '中砂', unit: '吨', supplier: '钱塘江砂场', lowThreshold: 40.0, siteId: 1 },
        { name: '机制砂', type: 'aggregate', specification: '细度模数2.6-2.8', unit: '吨', supplier: '杭州机制砂厂', lowThreshold: 35.0, siteId: 1 },
        
        // 粉料
        { name: 'P.O42.5水泥', type: 'cement', specification: '42.5级普通硅酸盐水泥', unit: '吨', supplier: '海螺水泥', lowThreshold: 20.0, siteId: 1 },
        { name: 'P.O52.5水泥', type: 'cement', specification: '52.5级普通硅酸盐水泥', unit: '吨', supplier: '海螺水泥', lowThreshold: 15.0, siteId: 1 },
        { name: 'S95矿粉', type: 'cement', specification: 'S95级矿渣粉', unit: '吨', supplier: '宝钢矿粉', lowThreshold: 10.0, siteId: 1 },
        { name: 'I级粉煤灰', type: 'cement', specification: 'I级粉煤灰', unit: '吨', supplier: '华能电厂', lowThreshold: 8.0, siteId: 1 },
        
        // 外加剂
        { name: '聚羧酸减水剂', type: 'additive', specification: '高效减水剂', unit: '吨', supplier: '建研科技', lowThreshold: 2.0, siteId: 1 },
        { name: '萘系减水剂', type: 'additive', specification: '标准减水剂', unit: '吨', supplier: '建研科技', lowThreshold: 1.5, siteId: 1 },
        { name: '引气剂', type: 'additive', specification: '松香热聚物', unit: '吨', supplier: '建研科技', lowThreshold: 0.5, siteId: 1 },
        
        // 水
        { name: '自来水', type: 'water', specification: '饮用水标准', unit: '吨', supplier: '杭州自来水公司', lowThreshold: 100.0, siteId: 1 },
      ],
      skipDuplicates: true,
    });

    // 7. 创建默认设备
    console.log('🚛 创建默认设备...');
    const equipment = await prisma.equipment.createMany({
      data: [
        // 搅拌车
        { name: '搅拌车001', equipmentType: 'vehicle', model: 'HDT5250GJB', capacity: 10.0, brand: '华菱', year: 2023, plateNumber: '浙A12345', siteId: 1 },
        { name: '搅拌车002', equipmentType: 'vehicle', model: 'HDT5250GJB', capacity: 10.0, brand: '华菱', year: 2023, plateNumber: '浙A12346', siteId: 1 },
        { name: '搅拌车003', equipmentType: 'vehicle', model: 'HDT5250GJB', capacity: 8.0, brand: '华菱', year: 2022, plateNumber: '浙A12347', siteId: 1 },
        
        // 搅拌机
        { name: '主搅拌机1#', equipmentType: 'mixer', model: 'JS3000', capacity: 3.0, brand: '南方路机', year: 2023, location: '生产车间A', siteId: 1 },
        { name: '主搅拌机2#', equipmentType: 'mixer', model: 'JS2000', capacity: 2.0, brand: '南方路机', year: 2022, location: '生产车间B', siteId: 1 },
        
        // 料仓
        { name: '水泥仓1#', equipmentType: 'silo', model: 'SNC100', capacity: 100.0, brand: '建友', year: 2023, location: '料仓区A', siteId: 1 },
        { name: '水泥仓2#', equipmentType: 'silo', model: 'SNC100', capacity: 100.0, brand: '建友', year: 2023, location: '料仓区A', siteId: 1 },
        { name: '粉煤灰仓', equipmentType: 'silo', model: 'SNC80', capacity: 80.0, brand: '建友', year: 2023, location: '料仓区B', siteId: 1 },
        
        // 计量秤
        { name: '水泥计量秤', equipmentType: 'scale', model: 'CS-2000', capacity: 2.0, brand: '托利多', year: 2023, location: '计量楼', siteId: 1 },
        { name: '骨料计量秤', equipmentType: 'scale', model: 'CS-5000', capacity: 5.0, brand: '托利多', year: 2023, location: '计量楼', siteId: 1 },
        { name: '水计量秤', equipmentType: 'scale', model: 'CS-500', capacity: 0.5, brand: '托利多', year: 2023, location: '计量楼', siteId: 1 },
      ],
      skipDuplicates: true,
    });

    // 8. 创建默认策略
    console.log('⚙️ 创建默认策略...');
    const strategies = await prisma.strategy.createMany({
      data: [
        {
          name: '砂含水率自动补偿',
          type: 'moisture',
          description: '根据砂石含水率自动调整用水量',
          enabled: true,
          priority: 1,
          conditions: JSON.stringify({ moistureRange: [2, 8] }),
          actions: JSON.stringify({ adjustWater: true, formula: 'water = water - (moisture * aggregate_weight * 0.01)' }),
          siteId: 1,
        },
        {
          name: '坍落度矫正',
          type: 'slump',
          description: '根据坍落度检测结果自动调整外加剂用量',
          enabled: true,
          priority: 2,
          conditions: JSON.stringify({ slumpDeviation: 20 }),
          actions: JSON.stringify({ adjustAdditive: true, maxAdjustment: 0.2 }),
          siteId: 1,
        },
        {
          name: '温度补偿',
          type: 'temperature',
          description: '根据环境温度调整配合比',
          enabled: true,
          priority: 3,
          conditions: JSON.stringify({ temperatureRange: [-5, 35] }),
          actions: JSON.stringify({ adjustWater: true, adjustAdditive: true }),
          siteId: 1,
        },
        {
          name: '骨料超差停机',
          type: 'aggregate',
          description: '骨料计量超差时自动停机',
          enabled: true,
          priority: 0,
          conditions: JSON.stringify({ maxDeviation: 3.0 }),
          actions: JSON.stringify({ stopProduction: true, alarm: true }),
          siteId: 1,
        },
        {
          name: 'AI策略',
          type: 'ai',
          description: '全自动ai完成配比管理',
          enabled: false,
          priority: 10,
          conditions: JSON.stringify({ aiModel: 'concrete-mix-v1.0' }),
          actions: JSON.stringify({ autoOptimize: true, learningMode: true }),
          siteId: 1,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ 数据库初始化完成！');
    console.log('📊 初始化统计：');
    console.log(`   - 站点: 3个`);
    console.log(`   - 角色: 5个`);
    console.log(`   - 用户: 1个 (admin/admin123)`);
    console.log(`   - 数据字典: 14项`);
    console.log(`   - 混凝土等级: 6个`);
    console.log(`   - 原材料: 12种`);
    console.log(`   - 设备: 11台`);
    console.log(`   - 策略: 5个`);
    console.log('');
    console.log('🔑 默认登录信息：');
    console.log('   用户名: admin');
    console.log('   密码: admin123');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });