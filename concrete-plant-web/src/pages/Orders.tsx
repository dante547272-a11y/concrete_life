/**
 * Orders Management Page
 */

import React from 'react';
import { Table, Button, Space, Input, Tag, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  concreteGrade: string;
  volume: number;
  deliveryAddress: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD20240115001', customerName: '建设公司A', concreteGrade: 'C30', volume: 50, deliveryAddress: '工地A', status: 'in_progress', createdAt: '2024-01-15' },
  { id: '2', orderNumber: 'ORD20240115002', customerName: '建设公司B', concreteGrade: 'C40', volume: 30, deliveryAddress: '工地B', status: 'pending', createdAt: '2024-01-15' },
  { id: '3', orderNumber: 'ORD20240114001', customerName: '建设公司C', concreteGrade: 'C25', volume: 80, deliveryAddress: '工地C', status: 'completed', createdAt: '2024-01-14' },
];

const statusColors = {
  pending: 'default',
  confirmed: 'blue',
  in_progress: 'processing',
  completed: 'green',
  cancelled: 'red',
};

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '生产中',
  completed: '已完成',
  cancelled: '已取消',
};

const Orders: React.FC = () => {
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
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
      title: '配送地址',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout selectedKey="orders">
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索订单号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <DatePicker.RangePicker />
          </Space>
          <Button type="primary" icon={<PlusOutlined />}>
            新增订单
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={mockOrders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </AppLayout>
  );
};

export default Orders;
