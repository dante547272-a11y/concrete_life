/**
 * Operation Logs Page - 操作日志
 */

import React, { useState } from 'react';
import { Table, Card, Space, Tag, Input, Select, DatePicker, Row, Col, Statistic, Button, message, Dropdown } from 'antd';
import { SearchOutlined, UserOutlined, SettingOutlined, FileTextOutlined, CarOutlined, ExperimentOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { AppLayout } from '../components/layout';
import { exportData } from '../utils/export';

const { RangePicker } = DatePicker;

interface LogRecord {
  id: string;
  timestamp: string;
  operator: string;
  module: 'vehicle' | 'order' | 'task' | 'recipe' | 'system' | 'user';
  action: string;
  target: string;
  detail: string;
  ip: string;
  result: 'success' | 'failure';
}

const mockLogs: LogRecord[] = [
  { id: '1', timestamp: '2024-01-15 10:45:32', operator: '张三', module: 'order', action: '创建订单', target: 'ORD20240115003', detail: '创建新订单，客户：广州建工集团，等级：C30，方量：48m³', ip: '192.168.1.100', result: 'success' },
  { id: '2', timestamp: '2024-01-15 10:30:15', operator: '李四', module: 'task', action: '分配车辆', target: 'T20240115002', detail: '为任务分配车辆：粤A23456，司机：李四', ip: '192.168.1.101', result: 'success' },
  { id: '3', timestamp: '2024-01-15 10:15:22', operator: '张三', module: 'vehicle', action: '更新状态', target: '粤A12345', detail: '车辆状态更新：空闲 -> 装车中', ip: '192.168.1.100', result: 'success' },
  { id: '4', timestamp: '2024-01-15 09:45:10', operator: '王五', module: 'recipe', action: '修改配方', target: 'C30标准配方', detail: '修改水泥用量：280kg -> 282kg', ip: '192.168.1.102', result: 'success' },
  { id: '5', timestamp: '2024-01-15 09:30:00', operator: '系统', module: 'system', action: '自动备份', target: '数据库', detail: '每日自动备份完成，备份文件：backup_20240115.sql', ip: '127.0.0.1', result: 'success' },
  { id: '6', timestamp: '2024-01-15 09:00:45', operator: '张三', module: 'user', action: '登录系统', target: '张三', detail: '用户登录成功', ip: '192.168.1.100', result: 'success' },
  { id: '7', timestamp: '2024-01-15 08:55:22', operator: '李四', module: 'user', action: '登录系统', target: '李四', detail: '用户登录失败：密码错误', ip: '192.168.1.101', result: 'failure' },
  { id: '8', timestamp: '2024-01-14 17:30:00', operator: '系统', module: 'system', action: '生成报表', target: '日报表', detail: '生成2024-01-14生产日报', ip: '127.0.0.1', result: 'success' },
  { id: '9', timestamp: '2024-01-14 16:45:32', operator: '王五', module: 'order', action: '取消订单', target: 'ORD20240114005', detail: '客户申请取消订单', ip: '192.168.1.102', result: 'success' },
  { id: '10', timestamp: '2024-01-14 15:20:18', operator: '张三', module: 'vehicle', action: '新增车辆', target: '粤A67890', detail: '新增搅拌车，容量：8m³', ip: '192.168.1.100', result: 'success' },
];

const moduleIcons: Record<string, React.ReactNode> = {
  vehicle: <CarOutlined />,
  order: <FileTextOutlined />,
  task: <FileTextOutlined />,
  recipe: <ExperimentOutlined />,
  system: <SettingOutlined />,
  user: <UserOutlined />,
};

const moduleLabels: Record<string, string> = {
  vehicle: '车辆管理',
  order: '订单管理',
  task: '任务管理',
  recipe: '配方管理',
  system: '系统',
  user: '用户',
};

const moduleColors: Record<string, string> = {
  vehicle: 'blue',
  order: 'green',
  task: 'purple',
  recipe: 'orange',
  system: 'default',
  user: 'cyan',
};

const Logs: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [resultFilter, setResultFilter] = useState<string | undefined>();

  // 导出功能
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const exportHeaders = {
        timestamp: '时间',
        operator: '操作员',
        module: '模块',
        action: '操作',
        target: '目标',
        detail: '详情',
        ip: 'IP地址',
        result: '结果'
      };

      const exportDataList = filteredData.map(log => ({
        ...log,
        module: moduleLabels[log.module],
        result: log.result === 'success' ? '成功' : '失败'
      }));

      exportData(exportDataList, '操作日志', format, exportHeaders);
      message.success(`导出${format.toUpperCase()}成功`);
    } catch (error) {
      message.error('导出失败');
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: '导出为 Excel',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'csv',
      label: '导出为 CSV',
      onClick: () => handleExport('csv'),
    },
    {
      key: 'json',
      label: '导出为 JSON',
      onClick: () => handleExport('json'),
    },
  ];

  const columns: ColumnsType<LogRecord> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module) => (
        <Space>
          {moduleIcons[module]}
          <Tag color={moduleColors[module]}>{moduleLabels[module]}</Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '对象',
      dataIndex: 'target',
      key: 'target',
      width: 150,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip) => <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{ip}</span>,
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (result) => (
        <Tag color={result === 'success' ? 'green' : 'red'}>
          {result === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
  ];

  const filteredData = mockLogs.filter((item) => {
    const matchSearch = !searchText || 
      item.operator.includes(searchText) || 
      item.action.includes(searchText) ||
      item.target.includes(searchText) ||
      item.detail.includes(searchText);
    const matchModule = !moduleFilter || item.module === moduleFilter;
    const matchResult = !resultFilter || item.result === resultFilter;
    return matchSearch && matchModule && matchResult;
  });

  // Statistics
  const todayLogs = mockLogs.filter(l => l.timestamp.startsWith('2024-01-15')).length;
  const failureLogs = mockLogs.filter(l => l.result === 'failure').length;
  const uniqueOperators = new Set(mockLogs.map(l => l.operator)).size;

  return (
    <AppLayout selectedKey="logs">
      <div style={{ padding: 0 }}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日操作" value={todayLogs} suffix="条" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总记录数" value={mockLogs.length} suffix="条" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="失败操作" 
                value={failureLogs} 
                suffix="条"
                valueStyle={{ color: failureLogs > 0 ? 'var(--status-stopped)' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="活跃用户" value={uniqueOperators} suffix="人" />
            </Card>
          </Col>
        </Row>

        <Card
          title="操作日志"
          extra={
            <Space>
              <Input
                placeholder="搜索日志"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="模块"
                allowClear
                value={moduleFilter}
                onChange={setModuleFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'vehicle', label: '车辆管理' },
                  { value: 'order', label: '订单管理' },
                  { value: 'task', label: '任务管理' },
                  { value: 'recipe', label: '配方管理' },
                  { value: 'system', label: '系统' },
                  { value: 'user', label: '用户' },
                ]}
              />
              <Select
                placeholder="结果"
                allowClear
                value={resultFilter}
                onChange={setResultFilter}
                style={{ width: 100 }}
                options={[
                  { value: 'success', label: '成功' },
                  { value: 'failure', label: '失败' },
                ]}
              />
              <RangePicker />
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />}>
                  导出数据
                </Button>
              </Dropdown>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            size="small"
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Logs;
