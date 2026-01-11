/**
 * Drivers Management Page
 */

import React from 'react';
import { Table, Button, Space, Input, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'active' | 'inactive' | 'expired';
}

const mockDrivers: Driver[] = [
  { id: '1', name: '张三', phone: '13800138001', licenseNumber: 'A2123456', licenseExpiry: '2025-06-15', status: 'active' },
  { id: '2', name: '李四', phone: '13800138002', licenseNumber: 'A2234567', licenseExpiry: '2024-12-01', status: 'active' },
  { id: '3', name: '王五', phone: '13800138003', licenseNumber: 'A2345678', licenseExpiry: '2024-01-01', status: 'expired' },
];

const statusColors = {
  active: 'green',
  inactive: 'default',
  expired: 'red',
};

const statusLabels = {
  active: '在职',
  inactive: '离职',
  expired: '资质过期',
};

const Drivers: React.FC = () => {
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '驾驶证号',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: '资质有效期',
      dataIndex: 'licenseExpiry',
      key: 'licenseExpiry',
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
      render: () => (
        <Space>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout selectedKey="drivers">
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索司机姓名"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />}>
            新增司机
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={mockDrivers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </AppLayout>
  );
};

export default Drivers;
