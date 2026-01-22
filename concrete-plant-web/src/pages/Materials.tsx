/**
 * Materials Management Page - 原材料库存管理
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Progress, Input, Select, Row, Col, Statistic, message, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, WarningOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import { AppLayout } from '../components/layout';
import { exportData } from '../utils/export';

interface Material {
  id: string;
  name: string;
  type: 'aggregate' | 'cement' | 'additive' | 'water';
  specification: string;
  currentStock: number;
  capacity: number;
  unit: string;
  lowThreshold: number;
  status: 'normal' | 'low' | 'critical';
  lastUpdate: string;
  supplier: string;
}

const mockMaterials: Material[] = [
  { id: '1', name: '骨料 5-10mm', type: 'aggregate', specification: '5-10mm', currentStock: 850, capacity: 1500, unit: '吨', lowThreshold: 300, status: 'normal', lastUpdate: '2024-01-15 10:30', supplier: '华南建材' },
  { id: '2', name: '骨料 10-20mm', type: 'aggregate', specification: '10-20mm', currentStock: 420, capacity: 1500, unit: '吨', lowThreshold: 300, status: 'normal', lastUpdate: '2024-01-15 10:30', supplier: '华南建材' },
  { id: '3', name: '骨料 20-31.5mm', type: 'aggregate', specification: '20-31.5mm', currentStock: 180, capacity: 1500, unit: '吨', lowThreshold: 300, status: 'low', lastUpdate: '2024-01-15 10:30', supplier: '华南建材' },
  { id: '4', name: '水泥 P.O 42.5', type: 'cement', specification: 'P.O 42.5', currentStock: 78, capacity: 200, unit: '吨', lowThreshold: 50, status: 'normal', lastUpdate: '2024-01-15 09:15', supplier: '海螺水泥' },
  { id: '5', name: '矿粉', type: 'cement', specification: 'S95', currentStock: 25, capacity: 100, unit: '吨', lowThreshold: 30, status: 'low', lastUpdate: '2024-01-15 09:15', supplier: '宝钢矿粉' },
  { id: '6', name: '粉煤灰', type: 'cement', specification: 'II级', currentStock: 45, capacity: 100, unit: '吨', lowThreshold: 30, status: 'normal', lastUpdate: '2024-01-15 09:15', supplier: '华能电厂' },
  { id: '7', name: '减水剂', type: 'additive', specification: '聚羧酸', currentStock: 2.5, capacity: 10, unit: '吨', lowThreshold: 2, status: 'normal', lastUpdate: '2024-01-15 08:00', supplier: '科之杰' },
  { id: '8', name: '水', type: 'water', specification: '自来水', currentStock: 85, capacity: 100, unit: '吨', lowThreshold: 20, status: 'normal', lastUpdate: '2024-01-15 10:30', supplier: '市政供水' },
];

const typeLabels: Record<string, string> = {
  aggregate: '骨料',
  cement: '粉料',
  additive: '外加剂',
  water: '水',
};

const typeColors: Record<string, string> = {
  aggregate: 'blue',
  cement: 'purple',
  additive: 'orange',
  water: 'cyan',
};

const statusColors: Record<string, string> = {
  normal: 'green',
  low: 'orange',
  critical: 'red',
};

const statusLabels: Record<string, string> = {
  normal: '正常',
  low: '偏低',
  critical: '告警',
};

const Materials: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  // 导出功能
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const exportHeaders = {
        name: '物料名称',
        type: '类型',
        specification: '规格',
        currentStock: '当前库存',
        capacity: '容量',
        unit: '单位',
        lowThreshold: '低库存阈值',
        status: '状态',
        supplier: '供应商',
        lastUpdate: '最后更新'
      };

      // 转换数据为中文
      const exportDataList = filteredData.map(material => ({
        ...material,
        type: typeLabels[material.type],
        status: material.status === 'normal' ? '正常' : material.status === 'low' ? '库存偏低' : '库存不足'
      }));

      exportData(exportDataList, '原材料库存', format, exportHeaders);
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

  const columns: ColumnsType<Material> = [
    {
      title: '物料名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.status !== 'normal' && <WarningOutlined style={{ color: 'var(--status-warning)' }} />}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: '当前库存',
      key: 'stock',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 16 }}>
            {record.currentStock} {record.unit}
          </span>
          <Progress
            percent={Math.round((record.currentStock / record.capacity) * 100)}
            size="small"
            status={record.status === 'critical' ? 'exception' : record.status === 'low' ? 'active' : 'normal'}
            strokeColor={record.status === 'low' ? 'var(--status-warning)' : undefined}
          />
        </Space>
      ),
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity, record) => `${capacity} ${record.unit}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>入库</a>
          <a>详情</a>
        </Space>
      ),
    },
  ];

  const filteredData = mockMaterials.filter((item) => {
    const matchSearch = !searchText || item.name.includes(searchText) || item.specification.includes(searchText);
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  // Statistics
  const lowStockCount = mockMaterials.filter(m => m.status === 'low' || m.status === 'critical').length;
  const totalTypes = new Set(mockMaterials.map(m => m.type)).size;

  return (
    <AppLayout selectedKey="materials">
      <div style={{ padding: 0 }}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="物料种类" value={mockMaterials.length} suffix="种" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="物料类型" value={totalTypes} suffix="类" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="库存偏低" 
                value={lowStockCount} 
                suffix="种"
                valueStyle={{ color: lowStockCount > 0 ? 'var(--status-warning)' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日入库" value={5} suffix="次" />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <Card
          title="原材料库存"
          extra={
            <Space>
              <Input
                placeholder="搜索物料名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="物料类型"
                allowClear
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'aggregate', label: '骨料' },
                  { value: 'cement', label: '粉料' },
                  { value: 'additive', label: '外加剂' },
                  { value: 'water', label: '水' },
                ]}
              />
              <Button icon={<ReloadOutlined />}>刷新</Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />}>
                  导出数据
                </Button>
              </Dropdown>
              <Button type="primary" icon={<PlusOutlined />}>入库登记</Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Materials;
