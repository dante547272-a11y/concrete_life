/**
 * Drivers Management Page
 */

import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, message, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { AppLayout } from '../components/layout';
import { exportData } from '../utils/export';

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
  const [searchText, setSearchText] = useState('');

  // 过滤数据
  const filteredDrivers = mockDrivers.filter(driver =>
    driver.name.toLowerCase().includes(searchText.toLowerCase()) ||
    driver.phone.includes(searchText) ||
    driver.licenseNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  // 导出功能
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const exportHeaders = {
        name: '姓名',
        phone: '电话',
        licenseNumber: '驾驶证号',
        licenseExpiry: '资质有效期',
        status: '状态'
      };

      // 转换状态为中文
      const exportData = filteredDrivers.map(driver => ({
        ...driver,
        status: statusLabels[driver.status]
      }));

      exportData(exportData, '司机管理', format, exportHeaders);
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
              placeholder="搜索司机姓名/电话/驾驶证号"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
          <Space>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>
                导出数据
              </Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />}>
              新增司机
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredDrivers}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </div>
    </AppLayout>
  );
};

export default Drivers;
