/**
 * Tasks Dispatch Page
 */

import React from 'react';
import { Table, Button, Space, Input, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';

interface Task {
  id: string;
  taskNumber: string;
  orderNumber: string;
  vehiclePlate: string | null;
  driverName: string | null;
  concreteGrade: string;
  volume: number;
  status: 'pending' | 'assigned' | 'loading' | 'delivering' | 'completed';
}

const mockTasks: Task[] = [
  { id: '1', taskNumber: 'T20240115001', orderNumber: 'ORD20240115001', vehiclePlate: '粤A12345', driverName: '张三', concreteGrade: 'C30', volume: 8, status: 'loading' },
  { id: '2', taskNumber: 'T20240115002', orderNumber: 'ORD20240115001', vehiclePlate: '粤A23456', driverName: '李四', concreteGrade: 'C30', volume: 8, status: 'delivering' },
  { id: '3', taskNumber: 'T20240115003', orderNumber: 'ORD20240115002', vehiclePlate: null, driverName: null, concreteGrade: 'C40', volume: 10, status: 'pending' },
];

const statusColors = {
  pending: 'default',
  assigned: 'blue',
  loading: 'processing',
  delivering: 'orange',
  completed: 'green',
};

const statusLabels = {
  pending: '待分配',
  assigned: '已分配',
  loading: '装车中',
  delivering: '配送中',
  completed: '已完成',
};

const Tasks: React.FC = () => {
  const columns = [
    {
      title: '任务号',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
    },
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '车牌号',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      render: (plate: string | null) => plate || <span style={{ color: 'var(--text-secondary)' }}>未分配</span>,
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (name: string | null) => name || <span style={{ color: 'var(--text-secondary)' }}>未分配</span>,
    },
    {
      title: '混凝土等级',
      dataIndex: 'concreteGrade',
      key: 'concreteGrade',
    },
    {
      title: '方量 (m³)',
      dataIndex: 'volume',
      key: 'volume',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Task) => (
        <Space>
          {record.status === 'pending' && (
            <Button type="link" size="small">分配车辆</Button>
          )}
          <Button type="link" size="small">查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout selectedKey="tasks">
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索任务号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />}>
            新建任务
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={mockTasks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </AppLayout>
  );
};

export default Tasks;
