/**
 * Equipment Management Page - 设备管理
 * 设备及配件/耗材生命周期管理，预测性维护
 */

import React, { useState } from 'react';
import { Card, Table, Tag, Progress, Space, Button, Modal, Descriptions, Tabs, Statistic, Row, Col, Badge, Tooltip } from 'antd';
import { 
  ToolOutlined, 
  ThunderboltOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  LineChartOutlined,
  AlertOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

// 设备状态类型
type EquipmentStatus = 'normal' | 'warning' | 'critical' | 'maintenance';

// 设备接口
interface Equipment {
  id: string;
  name: string;
  type: 'main' | 'accessory' | 'consumable';
  model: string;
  location: string;
  status: EquipmentStatus;
  installDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  remainingDays: number;
  healthScore: number;
  metrics: EquipmentMetrics;
  parts: EquipmentPart[];
}

// 设备指标
interface EquipmentMetrics {
  current: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
  vibration: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
  temperature: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
  startStopCount: number;
  totalRunningHours: number;
  dailyRunningHours: number;
}

// 配件/耗材
interface EquipmentPart {
  id: string;
  name: string;
  type: 'part' | 'consumable';
  lifespan: number; // 预期寿命(小时)
  usedHours: number;
  remainingPercent: number;
  status: 'good' | 'warning' | 'replace';
  lastReplaceDate: string;
}

const statusConfig: Record<EquipmentStatus, { color: string; text: string; icon: React.ReactNode }> = {
  normal: { color: 'green', text: '正常运行', icon: <CheckCircleOutlined /> },
  warning: { color: 'orange', text: '需要关注', icon: <ExclamationCircleOutlined /> },
  critical: { color: 'red', text: '需要维护', icon: <WarningOutlined /> },
  maintenance: { color: 'blue', text: '维护中', icon: <SettingOutlined /> },
};

const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: '主搅拌机',
    type: 'main',
    model: 'JS2000',
    location: '搅拌楼1层',
    status: 'normal',
    installDate: '2022-03-15',
    lastMaintenanceDate: '2025-12-01',
    nextMaintenanceDate: '2026-03-01',
    remainingDays: 47,
    healthScore: 92,
    metrics: {
      current: { value: 45.2, unit: 'A', status: 'normal' },
      vibration: { value: 2.3, unit: 'mm/s', status: 'normal' },
      temperature: { value: 58, unit: '°C', status: 'normal' },
      startStopCount: 12580,
      totalRunningHours: 8520,
      dailyRunningHours: 6.5,
    },
    parts: [
      { id: 'p1', name: '搅拌叶片', type: 'consumable', lifespan: 2000, usedHours: 1650, remainingPercent: 17.5, status: 'warning', lastReplaceDate: '2025-08-10' },
      { id: 'p2', name: '衬板', type: 'consumable', lifespan: 3000, usedHours: 1200, remainingPercent: 60, status: 'good', lastReplaceDate: '2025-06-15' },
      { id: 'p3', name: '主轴承', type: 'part', lifespan: 15000, usedHours: 8520, remainingPercent: 43.2, status: 'good', lastReplaceDate: '2022-03-15' },
      { id: 'p4', name: '密封件', type: 'consumable', lifespan: 1500, usedHours: 1420, remainingPercent: 5.3, status: 'replace', lastReplaceDate: '2025-09-20' },
    ],
  },
  {
    id: '2',
    name: '骨料皮带机',
    type: 'main',
    model: 'TD75-800',
    location: '骨料仓区',
    status: 'warning',
    installDate: '2022-03-15',
    lastMaintenanceDate: '2025-11-15',
    nextMaintenanceDate: '2026-02-15',
    remainingDays: 33,
    healthScore: 78,
    metrics: {
      current: { value: 28.5, unit: 'A', status: 'normal' },
      vibration: { value: 4.8, unit: 'mm/s', status: 'warning' },
      temperature: { value: 52, unit: '°C', status: 'normal' },
      startStopCount: 15620,
      totalRunningHours: 9200,
      dailyRunningHours: 7.2,
    },
    parts: [
      { id: 'p5', name: '输送带', type: 'consumable', lifespan: 8000, usedHours: 6800, remainingPercent: 15, status: 'warning', lastReplaceDate: '2024-01-10' },
      { id: 'p6', name: '托辊', type: 'part', lifespan: 12000, usedHours: 9200, remainingPercent: 23.3, status: 'warning', lastReplaceDate: '2022-03-15' },
      { id: 'p7', name: '驱动滚筒', type: 'part', lifespan: 20000, usedHours: 9200, remainingPercent: 54, status: 'good', lastReplaceDate: '2022-03-15' },
    ],
  },
  {
    id: '3',
    name: '螺旋输送机',
    type: 'main',
    model: 'LSY300',
    location: '粉料仓区',
    status: 'critical',
    installDate: '2022-05-20',
    lastMaintenanceDate: '2025-10-01',
    nextMaintenanceDate: '2026-01-01',
    remainingDays: -12,
    healthScore: 58,
    metrics: {
      current: { value: 18.8, unit: 'A', status: 'warning' },
      vibration: { value: 6.2, unit: 'mm/s', status: 'critical' },
      temperature: { value: 72, unit: '°C', status: 'warning' },
      startStopCount: 18900,
      totalRunningHours: 7800,
      dailyRunningHours: 5.8,
    },
    parts: [
      { id: 'p8', name: '螺旋叶片', type: 'consumable', lifespan: 4000, usedHours: 3950, remainingPercent: 1.25, status: 'replace', lastReplaceDate: '2024-06-01' },
      { id: 'p9', name: '吊轴承', type: 'part', lifespan: 8000, usedHours: 7800, remainingPercent: 2.5, status: 'replace', lastReplaceDate: '2022-05-20' },
    ],
  },
  {
    id: '4',
    name: '水泵',
    type: 'accessory',
    model: 'ISG50-160',
    location: '水系统',
    status: 'normal',
    installDate: '2023-01-10',
    lastMaintenanceDate: '2025-12-10',
    nextMaintenanceDate: '2026-06-10',
    remainingDays: 148,
    healthScore: 95,
    metrics: {
      current: { value: 8.2, unit: 'A', status: 'normal' },
      vibration: { value: 1.5, unit: 'mm/s', status: 'normal' },
      temperature: { value: 42, unit: '°C', status: 'normal' },
      startStopCount: 8500,
      totalRunningHours: 4200,
      dailyRunningHours: 3.5,
    },
    parts: [
      { id: 'p10', name: '机械密封', type: 'consumable', lifespan: 6000, usedHours: 2100, remainingPercent: 65, status: 'good', lastReplaceDate: '2024-06-15' },
      { id: 'p11', name: '叶轮', type: 'part', lifespan: 15000, usedHours: 4200, remainingPercent: 72, status: 'good', lastReplaceDate: '2023-01-10' },
    ],
  },
  {
    id: '5',
    name: '空压机',
    type: 'accessory',
    model: 'GA37',
    location: '气源系统',
    status: 'maintenance',
    installDate: '2022-08-01',
    lastMaintenanceDate: '2026-01-10',
    nextMaintenanceDate: '2026-04-10',
    remainingDays: 87,
    healthScore: 85,
    metrics: {
      current: { value: 52.0, unit: 'A', status: 'normal' },
      vibration: { value: 3.1, unit: 'mm/s', status: 'normal' },
      temperature: { value: 85, unit: '°C', status: 'normal' },
      startStopCount: 5200,
      totalRunningHours: 12500,
      dailyRunningHours: 10.2,
    },
    parts: [
      { id: 'p12', name: '空滤', type: 'consumable', lifespan: 2000, usedHours: 1800, remainingPercent: 10, status: 'warning', lastReplaceDate: '2025-07-01' },
      { id: 'p13', name: '油滤', type: 'consumable', lifespan: 2000, usedHours: 1800, remainingPercent: 10, status: 'warning', lastReplaceDate: '2025-07-01' },
      { id: 'p14', name: '油分', type: 'consumable', lifespan: 4000, usedHours: 3200, remainingPercent: 20, status: 'warning', lastReplaceDate: '2024-10-01' },
      { id: 'p15', name: '润滑油', type: 'consumable', lifespan: 4000, usedHours: 3600, remainingPercent: 10, status: 'warning', lastReplaceDate: '2024-10-01' },
    ],
  },
];


const Equipment: React.FC = () => {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleViewDetail = (record: Equipment) => {
    setSelectedEquipment(record);
    setDetailVisible(true);
  };

  // 获取指标状态颜色
  const getMetricColor = (status: 'normal' | 'warning' | 'critical') => {
    return { normal: '#52c41a', warning: '#faad14', critical: '#f5222d' }[status];
  };

  // 获取配件状态
  const getPartStatus = (status: 'good' | 'warning' | 'replace') => {
    return {
      good: { color: 'green', text: '良好' },
      warning: { color: 'orange', text: '关注' },
      replace: { color: 'red', text: '需更换' },
    }[status];
  };

  // 计算建议检修时间
  const getMaintenanceRecommendation = (equipment: Equipment) => {
    const { metrics, parts } = equipment;
    const issues: string[] = [];
    
    // 检查指标
    if (metrics.vibration.status !== 'normal') issues.push('振动异常');
    if (metrics.temperature.status !== 'normal') issues.push('温度偏高');
    if (metrics.current.status !== 'normal') issues.push('电流异常');
    
    // 检查配件
    const criticalParts = parts.filter(p => p.status === 'replace');
    if (criticalParts.length > 0) {
      issues.push(`${criticalParts.length}个配件需更换`);
    }
    
    if (issues.length === 0) return { urgency: 'low', text: '按计划维护即可' };
    if (issues.length <= 2) return { urgency: 'medium', text: `建议近期检修: ${issues.join(', ')}` };
    return { urgency: 'high', text: `建议立即检修: ${issues.join(', ')}` };
  };

  const columns: ColumnsType<Equipment> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <ToolOutlined style={{ color: '#1890ff' }} />
          <a onClick={() => handleViewDetail(record)}>{name}</a>
        </Space>
      ),
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: EquipmentStatus) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: Object.entries(statusConfig).map(([k, v]) => ({ text: v.text, value: k })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '健康度',
      dataIndex: 'healthScore',
      key: 'healthScore',
      sorter: (a, b) => a.healthScore - b.healthScore,
      render: (score) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'}
          format={(p) => `${p}%`}
        />
      ),
    },
    {
      title: '运行时间',
      key: 'runningHours',
      render: (_, record) => (
        <span>{record.metrics.totalRunningHours.toLocaleString()} 小时</span>
      ),
      sorter: (a, b) => a.metrics.totalRunningHours - b.metrics.totalRunningHours,
    },
    {
      title: '下次维护',
      key: 'nextMaintenance',
      render: (_, record) => {
        const days = record.remainingDays;
        let color = 'green';
        if (days < 0) color = 'red';
        else if (days < 30) color = 'orange';
        
        return (
          <Space direction="vertical" size={0}>
            <span>{record.nextMaintenanceDate}</span>
            <Tag color={color}>
              {days < 0 ? `已超期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
            </Tag>
          </Space>
        );
      },
      sorter: (a, b) => a.remainingDays - b.remainingDays,
    },
    {
      title: '检修建议',
      key: 'recommendation',
      render: (_, record) => {
        const rec = getMaintenanceRecommendation(record);
        const colors = { low: 'green', medium: 'orange', high: 'red' };
        return (
          <Tooltip title={rec.text}>
            <Tag color={colors[rec.urgency as keyof typeof colors]}>
              {rec.urgency === 'high' ? '立即检修' : rec.urgency === 'medium' ? '近期检修' : '正常'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small">维护记录</Button>
        </Space>
      ),
    },
  ];

  // 配件表格列
  const partColumns: ColumnsType<EquipmentPart> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type) => <Tag>{type === 'part' ? '配件' : '耗材'}</Tag>
    },
    { 
      title: '寿命进度', 
      key: 'progress',
      render: (_, record) => (
        <Progress 
          percent={100 - record.remainingPercent} 
          size="small"
          strokeColor={record.remainingPercent > 30 ? '#52c41a' : record.remainingPercent > 10 ? '#faad14' : '#f5222d'}
          format={() => `${record.usedHours}/${record.lifespan}h`}
        />
      )
    },
    { 
      title: '剩余寿命', 
      key: 'remaining',
      render: (_, record) => (
        <span style={{ color: record.remainingPercent < 10 ? '#f5222d' : 'inherit' }}>
          {record.remainingPercent.toFixed(1)}%
        </span>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const config = getPartStatus(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    { title: '上次更换', dataIndex: 'lastReplaceDate', key: 'lastReplaceDate' },
  ];

  // 统计数据
  const stats = {
    total: mockEquipment.length,
    normal: mockEquipment.filter(e => e.status === 'normal').length,
    warning: mockEquipment.filter(e => e.status === 'warning' || e.status === 'critical').length,
    maintenance: mockEquipment.filter(e => e.status === 'maintenance').length,
    overdue: mockEquipment.filter(e => e.remainingDays < 0).length,
    partsToReplace: mockEquipment.reduce((sum, e) => sum + e.parts.filter(p => p.status === 'replace').length, 0),
  };

  return (
    <AppLayout selectedKey="equipment">
      <div style={{ padding: 0 }}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="设备总数" value={stats.total} prefix={<ToolOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="正常运行" value={stats.normal} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="需要关注" value={stats.warning} valueStyle={{ color: '#faad14' }} prefix={<ExclamationCircleOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="维护中" value={stats.maintenance} valueStyle={{ color: '#1890ff' }} prefix={<SettingOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="维护超期" value={stats.overdue} valueStyle={{ color: '#f5222d' }} prefix={<AlertOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="待更换配件" value={stats.partsToReplace} valueStyle={{ color: '#f5222d' }} prefix={<WarningOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* 设备列表 */}
        <Card
          title={
            <Space>
              <ToolOutlined />
              设备管理
            </Space>
          }
          extra={<Button type="primary">添加设备</Button>}
        >
          <Table
            columns={columns}
            dataSource={mockEquipment}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* 设备详情弹窗 */}
        <Modal
          title={
            <Space>
              <ToolOutlined style={{ color: '#1890ff' }} />
              {selectedEquipment?.name} - 设备详情
            </Space>
          }
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          width={800}
        >
          {selectedEquipment && (
            <Tabs
              items={[
                {
                  key: 'overview',
                  label: '基本信息',
                  children: (
                    <>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="设备名称">{selectedEquipment.name}</Descriptions.Item>
                        <Descriptions.Item label="型号">{selectedEquipment.model}</Descriptions.Item>
                        <Descriptions.Item label="安装位置">{selectedEquipment.location}</Descriptions.Item>
                        <Descriptions.Item label="安装日期">{selectedEquipment.installDate}</Descriptions.Item>
                        <Descriptions.Item label="状态">
                          <Tag color={statusConfig[selectedEquipment.status].color}>
                            {statusConfig[selectedEquipment.status].text}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="健康度">
                          <Progress percent={selectedEquipment.healthScore} size="small" style={{ width: 120 }} />
                        </Descriptions.Item>
                        <Descriptions.Item label="上次维护">{selectedEquipment.lastMaintenanceDate}</Descriptions.Item>
                        <Descriptions.Item label="下次维护">
                          {selectedEquipment.nextMaintenanceDate}
                          <Tag color={selectedEquipment.remainingDays < 0 ? 'red' : selectedEquipment.remainingDays < 30 ? 'orange' : 'green'} style={{ marginLeft: 8 }}>
                            {selectedEquipment.remainingDays < 0 ? `超期${Math.abs(selectedEquipment.remainingDays)}天` : `${selectedEquipment.remainingDays}天后`}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                      
                      <Card title="检修建议" size="small" style={{ marginTop: 16 }}>
                        {(() => {
                          const rec = getMaintenanceRecommendation(selectedEquipment);
                          const colors = { low: '#52c41a', medium: '#faad14', high: '#f5222d' };
                          return (
                            <div style={{ color: colors[rec.urgency as keyof typeof colors], fontWeight: 'bold' }}>
                              {rec.text}
                            </div>
                          );
                        })()}
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'metrics',
                  label: '运行指标',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic 
                              title={<><ThunderboltOutlined /> 电流</>}
                              value={selectedEquipment.metrics.current.value}
                              suffix={selectedEquipment.metrics.current.unit}
                              valueStyle={{ color: getMetricColor(selectedEquipment.metrics.current.status) }}
                            />
                            <Badge status={selectedEquipment.metrics.current.status === 'normal' ? 'success' : selectedEquipment.metrics.current.status === 'warning' ? 'warning' : 'error'} text={selectedEquipment.metrics.current.status === 'normal' ? '正常' : '异常'} />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic 
                              title={<><LineChartOutlined /> 振动</>}
                              value={selectedEquipment.metrics.vibration.value}
                              suffix={selectedEquipment.metrics.vibration.unit}
                              valueStyle={{ color: getMetricColor(selectedEquipment.metrics.vibration.status) }}
                            />
                            <Badge status={selectedEquipment.metrics.vibration.status === 'normal' ? 'success' : selectedEquipment.metrics.vibration.status === 'warning' ? 'warning' : 'error'} text={selectedEquipment.metrics.vibration.status === 'normal' ? '正常' : '异常'} />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic 
                              title="温度"
                              value={selectedEquipment.metrics.temperature.value}
                              suffix={selectedEquipment.metrics.temperature.unit}
                              valueStyle={{ color: getMetricColor(selectedEquipment.metrics.temperature.status) }}
                            />
                            <Badge status={selectedEquipment.metrics.temperature.status === 'normal' ? 'success' : selectedEquipment.metrics.temperature.status === 'warning' ? 'warning' : 'error'} text={selectedEquipment.metrics.temperature.status === 'normal' ? '正常' : '异常'} />
                          </Card>
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 16 }}>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="启停次数" value={selectedEquipment.metrics.startStopCount.toLocaleString()} suffix="次" />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="累计运行" value={selectedEquipment.metrics.totalRunningHours.toLocaleString()} suffix="小时" />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic title="日均运行" value={selectedEquipment.metrics.dailyRunningHours} suffix="小时/天" />
                          </Card>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'parts',
                  label: '配件/耗材',
                  children: (
                    <Table
                      columns={partColumns}
                      dataSource={selectedEquipment.parts}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Equipment;
