import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('🗄️ 初始化边缘计算节点数据库...');

  try {
    // 1. 初始化基础配置
    console.log('📝 创建基础配置...');
    
    const configs = [
      {
        key: 'site_id',
        value: '1',
        description: '站点ID',
      },
      {
        key: 'site_name',
        value: '杭州总站',
        description: '站点名称',
      },
      {
        key: 'site_code',
        value: 'HZ001',
        description: '站点代码',
      },
      {
        key: 'central_server_url',
        value: 'http://localhost:3001',
        description: '中央服务器地址',
      },
      {
        key: 'api_key',
        value: 'edge-node-api-key-123456',
        description: 'API密钥',
      },
      {
        key: 'sync_interval',
        value: '5000',
        description: '同步间隔（毫秒）',
      },
      {
        key: 'data_retention_days',
        value: '30',
        description: '数据保留天数',
      },
    ];

    for (const config of configs) {
      await prisma.edgeConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config,
      });
    }

    // 2. 初始化设备连接配置
    console.log('🔌 创建设备连接配置...');
    
    const devices = [
      {
        deviceType: 'modbus',
        deviceId: 'plc_main',
        host: '192.168.1.100',
        port: 502,
        status: 'disconnected',
      },
      {
        deviceType: 'opcua',
        deviceId: 'scada_server',
        host: '192.168.1.101',
        port: 4840,
        status: 'disconnected',
      },
    ];

    for (const device of devices) {
      await prisma.deviceConnection.upsert({
        where: { 
          deviceType_deviceId: {
            deviceType: device.deviceType,
            deviceId: device.deviceId,
          }
        },
        update: device,
        create: device,
      });
    }

    // 3. 初始化数据点配置
    console.log('📊 创建数据点配置...');
    
    const dataPoints = [
      // 搅拌机数据点
      {
        tagName: 'mixer_status',
        deviceId: 'plc_main',
        address: '1000',
        dataType: 'bool',
        value: 'false',
        description: '搅拌机运行状态',
      },
      {
        tagName: 'mixer_speed',
        deviceId: 'plc_main',
        address: '1001',
        dataType: 'float',
        value: '0',
        description: '搅拌机转速',
      },
      {
        tagName: 'mixer_current',
        deviceId: 'plc_main',
        address: '1002',
        dataType: 'float',
        value: '0',
        description: '搅拌机电流',
      },
      {
        tagName: 'mixer_temperature',
        deviceId: 'plc_main',
        address: '1003',
        dataType: 'float',
        value: '25',
        description: '搅拌机温度',
      },
      // 计量系统数据点
      {
        tagName: 'cement_weight',
        deviceId: 'plc_main',
        address: '2000',
        dataType: 'float',
        value: '0',
        description: '水泥重量',
      },
      {
        tagName: 'water_weight',
        deviceId: 'plc_main',
        address: '2001',
        dataType: 'float',
        value: '0',
        description: '水重量',
      },
      {
        tagName: 'sand_weight',
        deviceId: 'plc_main',
        address: '2002',
        dataType: 'float',
        value: '0',
        description: '砂重量',
      },
      {
        tagName: 'gravel_weight',
        deviceId: 'plc_main',
        address: '2003',
        dataType: 'float',
        value: '0',
        description: '石子重量',
      },
      {
        tagName: 'additive_weight',
        deviceId: 'plc_main',
        address: '2004',
        dataType: 'float',
        value: '0',
        description: '外加剂重量',
      },
      // 输送系统数据点
      {
        tagName: 'belt1_speed',
        deviceId: 'plc_main',
        address: '3000',
        dataType: 'float',
        value: '0',
        description: '输送带1速度',
      },
      {
        tagName: 'belt2_speed',
        deviceId: 'plc_main',
        address: '3001',
        dataType: 'float',
        value: '0',
        description: '输送带2速度',
      },
      // 安全系统数据点
      {
        tagName: 'safety_door',
        deviceId: 'plc_main',
        address: '5000',
        dataType: 'bool',
        value: 'true',
        description: '安全门状态',
      },
      {
        tagName: 'emergency_button',
        deviceId: 'plc_main',
        address: '5001',
        dataType: 'bool',
        value: 'false',
        description: '急停按钮状态',
      },
    ];

    for (const point of dataPoints) {
      await prisma.dataPoint.upsert({
        where: {
          tagName_deviceId: {
            tagName: point.tagName,
            deviceId: point.deviceId,
          }
        },
        update: point,
        create: point,
      });
    }

    // 4. 初始化配方数据
    console.log('📋 创建默认配方...');
    
    const recipes = [
      {
        id: 'recipe_c30',
        name: 'C30混凝土',
        cement: 350,
        water: 175,
        sand: 650,
        gravel: 1200,
        additive: 3.5,
        mixingTime: 120,
      },
      {
        id: 'recipe_c35',
        name: 'C35混凝土',
        cement: 380,
        water: 170,
        sand: 630,
        gravel: 1180,
        additive: 4.0,
        mixingTime: 120,
      },
      {
        id: 'recipe_c40',
        name: 'C40混凝土',
        cement: 420,
        water: 165,
        sand: 610,
        gravel: 1160,
        additive: 4.5,
        mixingTime: 150,
      },
    ];

    for (const recipe of recipes) {
      await prisma.recipe.upsert({
        where: { id: recipe.id },
        update: recipe,
        create: recipe,
      });
    }

    // 5. 初始化安全规则
    console.log('🛡️ 创建安全规则...');
    
    const safetyRules = [
      {
        id: 'rule_temp_high',
        name: '设备温度过高',
        type: 'temperature',
        condition: 'greater_than',
        threshold: 80,
        action: 'alarm',
      },
      {
        id: 'rule_temp_critical',
        name: '设备温度危险',
        type: 'temperature',
        condition: 'greater_than',
        threshold: 90,
        action: 'stop',
      },
      {
        id: 'rule_safety_door',
        name: '安全门未关闭',
        type: 'door',
        condition: 'equals',
        threshold: 0,
        action: 'stop',
      },
      {
        id: 'rule_emergency',
        name: '急停按钮激活',
        type: 'emergency',
        condition: 'equals',
        threshold: 1,
        action: 'emergency_stop',
      },
    ];

    for (const rule of safetyRules) {
      await prisma.safetyRule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule,
      });
    }

    // 6. 初始化同步状态
    console.log('🔄 创建同步状态...');
    
    const syncStatuses = [
      {
        type: 'connection',
        status: 'offline',
      },
      {
        type: 'data_sync',
        status: 'offline',
      },
      {
        type: 'config_sync',
        status: 'offline',
      },
    ];

    for (const syncStatus of syncStatuses) {
      await prisma.syncStatus.upsert({
        where: { type: syncStatus.type },
        update: syncStatus,
        create: syncStatus,
      });
    }

    console.log('✅ 数据库初始化完成！');
    console.log('');
    console.log('📊 初始化统计:');
    console.log(`   - 配置项: ${configs.length}`);
    console.log(`   - 设备连接: ${devices.length}`);
    console.log(`   - 数据点: ${dataPoints.length}`);
    console.log(`   - 配方: ${recipes.length}`);
    console.log(`   - 安全规则: ${safetyRules.length}`);
    console.log(`   - 同步状态: ${syncStatuses.length}`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 初始化完成，可以启动边缘计算节点了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

export { initializeDatabase };