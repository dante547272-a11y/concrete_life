/**
 * Quality Traceability Page - 质量追溯
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, DatePicker, Row, Col, Statistic, Timeline, Modal, Descriptions, message, Dropdown } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import { AppLayout } from '../components/layout';
import { exportData } from '../utils/export';

const { RangePicker } = DatePicker;

interface QualityRecord {
  id: string;
  batchNumber: string;
  taskNumber: string;
  concreteGrade: string;
  volume: number;
  productionTime: string;
  slumpTest: number;
  slumpStatus: 'pass' | 'fail' | 'warning';
  strengthTest?: number;
  strengthStatus?: 'pass' | 'fail' | 'pending';
  operator: string;
  vehiclePlate: string;
  deliveryAddress: string;
  materials: { name: string; target: number; actual: number; deviation: number }[];
}

const mockRecords: QualityRecord[] = [
  {
    id: '1',
    batchNumber: 'B20240115001',
    taskNumber: 'T20240115001',
    concreteGrade: 'C30',
    volume: 8,
    productionTime: '2024-01-15 10:15:32',
    slumpTest: 175,
    slumpStatus: 'pass',
    strengthTest: 32.5,
    strengthStatus: 'pass',
    operator: '张三',
    vehiclePlate: '粤A12345',
    deliveryAddress: '广州市天河区某工地',
    materials: [
      { name: '水泥', target: 280, actual: 282, deviation: 0.7 },
      { name: '骨料5-10', target: 800, actual: 805, deviation: 0.6 },
      { name: '骨料10-20', target: 400, actual: 398, deviation: -0.5 },
      { name: '水', target: 175, actual: 174, deviation: -0.6 },
    ],
  },
  {
    id: '2',
    batchNumber: 'B20240115002',
    taskNumber: 'T20240115002',
    concreteGrade: 'C30',
    volume: 8,
    productionTime: '2024-01-15 10:32:18',
    slumpTest: 185,
    slumpStatus: 'pass',
    strengthTest: 31.8,
    strengthStatus: 'pass',
    operator: '张三',
    vehiclePlate: '粤A23456',
    deliveryAddress: '广州市番禺区某工地',
    materials: [
      { name: '水泥', target: 280, actual: 279, deviation: -0.4 },
      { name: '骨料5-10', target: 800, actual: 798, deviation: -0.3 },
      { name: '骨料10-20', target: 400, actual: 402, deviation: 0.5 },
      { name: '水', target: 175, actual: 176, deviation: 0.6 },
    ],
  },
  {
    id: '3',
    batchNumber: 'B20240115003',
    taskNumber: 'T20240115003',
    concreteGrade: 'C40',
    volume: 6,
    productionTime: '2024-01-15 10:48:45',
    slumpTest: 155,
    slumpStatus: 'warning',
    strengthStatus: 'pending',
    operator: '李四',
    vehiclePlate: '粤A34567',
    deliveryAddress: '广州市海珠区某工地',
    materials: [
      { name: '水泥', target: 350, actual: 352, deviation: 0.6 },
      { name: '骨料5-10', target: 750, actual: 748, deviation: -0.3 },
      { name: '骨料10-20', target: 450, actual: 455, deviation: 1.1 },
      { name: '水', target: 165, actual: 163, deviation: -1.2 },
    ],
  },
  {
    id: '4',
    batchNumber: 'B20240115004',
    taskNumber: 'T20240115004',
    concreteGrade: 'C30',
    volume: 8,
    productionTime: '2024-01-15 11:05:22',
    slumpTest: 210,
    slumpStatus: 'fail',
    strengthStatus: 'pending',
    operator: '李四',
    vehiclePlate: '粤A45678',
    deliveryAddress: '广州市白云区某工地',
    materials: [
      { name: '水泥', target: 280, actual: 275, deviation: -1.8 },
      { name: '骨料5-10', target: 800, actual: 795, deviation: -0.6 },
      { name: '骨料10-20', target: 400, actual: 398, deviation: -0.5 },
      { name: '水', target: 175, actual: 182, deviation: 4.0 },
    ],
  },
];

const statusIcons = {
  pass: <CheckCircleOutlined style={{ color: 'var(--status-running)' }} />,
  fail: <CloseCircleOutlined style={{ color: 'var(--status-stopped)' }} />,
  warning: <ExclamationCircleOutlined style={{ color: 'var(--status-warning)' }} />,
  pending: <ExclamationCircleOutlined style={{ color: 'var(--text-secondary)' }} />,
};

const Quality: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<QualityRecord | null>(null);

  // 导出功能
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const exportHeaders = {
        batchNumber: '批次号',
        taskNumber: '任务号',
        concreteGrade: '混凝土等级',
        volume: '方量(m³)',
        productionTime: '生产时间',
        slumpTest: '坍落度(mm)',
        slumpStatus: '坍落度状态',
        strengthTest: '强度(MPa)',
        strengthStatus: '强度状态',
        operator: '操作员',
        vehiclePlate: '车牌',
        deliveryAddress: '送货地址'
      };

      // 转换状态为中文
      const statusMap = {
        pass: '合格',
        fail: '不合格',
        warning: '警告',
        pending: '待检'
      };

      const exportDataList = filteredData.map(record => ({
        ...record,
        slumpStatus: statusMap[record.slumpStatus],
        strengthStatus: statusMap[record.strengthStatus || 'pending'],
        strengthTest: record.strengthTest || '待检'
      }));

      exportData(exportDataList, '质量追溯', format, exportHeaders);
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

  const showDetail = (record: QualityRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const columns: ColumnsType<QualityRecord> = [
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      render: (text) => <a onClick={() => {}}>{text}</a>,
    },
    {
      title: '任务号',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
    },
    {
      title: '等级',
      dataIndex: 'concreteGrade',
      key: 'concreteGrade',
      render: (grade) => <Tag color="blue">{grade}</Tag>,
    },
    {
      title: '方量',
      dataIndex: 'volume',
      key: 'volume',
      render: (v) => `${v} m³`,
    },
    {
      title: '生产时间',
      dataIndex: 'productionTime',
      key: 'productionTime',
    },
    {
      title: '坍落度',
      key: 'slump',
      render: (_, record) => (
        <Space>
          {statusIcons[record.slumpStatus]}
          <span>{record.slumpTest}mm</span>
        </Space>
      ),
    },
    {
      title: '强度检测',
      key: 'strength',
      render: (_, record) => (
        <Space>
          {statusIcons[record.strengthStatus || 'pending']}
          <span>{record.strengthTest ? `${record.strengthTest}MPa` : '待检'}</span>
        </Space>
      ),
    },
    {
      title: '车牌',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
          追溯
        </Button>
      ),
    },
  ];

  const filteredData = mockRecords.filter((item) => {
    return !searchText || 
      item.batchNumber.includes(searchText) || 
      item.taskNumber.includes(searchText);
  });

  const passCount = mockRecords.filter(r => r.slumpStatus === 'pass').length;
  const passRate = Math.round((passCount / mockRecords.length) * 100);

  return (
    <AppLayout selectedKey="quality">
      <div style={{ padding: 0 }}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日批次" value={mockRecords.length} suffix="批" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="合格批次" value={passCount} suffix="批" valueStyle={{ color: 'var(--status-running)' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="合格率" value={passRate} suffix="%" valueStyle={{ color: passRate >= 95 ? 'var(--status-running)' : 'var(--status-warning)' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="待检批次" value={mockRecords.filter(r => r.strengthStatus === 'pending').length} suffix="批" />
            </Card>
          </Col>
        </Row>

        <Card
          title="质量追溯"
          extra={
            <Space>
              <Input
                placeholder="搜索批次号/任务号"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
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
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title={`质量追溯 - ${selectedRecord?.batchNumber}`}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={800}
        >
          {selectedRecord && (
            <>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="批次号">{selectedRecord.batchNumber}</Descriptions.Item>
                <Descriptions.Item label="任务号">{selectedRecord.taskNumber}</Descriptions.Item>
                <Descriptions.Item label="混凝土等级">{selectedRecord.concreteGrade}</Descriptions.Item>
                <Descriptions.Item label="方量">{selectedRecord.volume} m³</Descriptions.Item>
                <Descriptions.Item label="生产时间">{selectedRecord.productionTime}</Descriptions.Item>
                <Descriptions.Item label="操作员">{selectedRecord.operator}</Descriptions.Item>
                <Descriptions.Item label="车牌号">{selectedRecord.vehiclePlate}</Descriptions.Item>
                <Descriptions.Item label="送货地址">{selectedRecord.deliveryAddress}</Descriptions.Item>
              </Descriptions>

              <Card title="配料记录" size="small" style={{ marginBottom: 16 }}>
                <Table
                  dataSource={selectedRecord.materials}
                  columns={[
                    { title: '材料', dataIndex: 'name', key: 'name' },
                    { title: '目标值(kg)', dataIndex: 'target', key: 'target' },
                    { title: '实际值(kg)', dataIndex: 'actual', key: 'actual' },
                    { 
                      title: '偏差(%)', 
                      dataIndex: 'deviation', 
                      key: 'deviation',
                      render: (v) => (
                        <span style={{ color: Math.abs(v) > 2 ? 'var(--status-warning)' : 'var(--status-running)' }}>
                          {v > 0 ? '+' : ''}{v}%
                        </span>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              </Card>

              <Card title="生产流程" size="small">
                <Timeline
                  items={[
                    { color: 'green', children: '配料开始 - 10:15:00' },
                    { color: 'green', children: '骨料称重完成 - 10:15:45' },
                    { color: 'green', children: '粉料称重完成 - 10:16:20' },
                    { color: 'green', children: '水和外加剂投放 - 10:16:35' },
                    { color: 'green', children: '搅拌开始 - 10:16:40' },
                    { color: 'green', children: '搅拌完成 - 10:17:40' },
                    { color: 'green', children: '出料完成 - 10:18:02' },
                    { color: 'blue', children: '坍落度检测 - 175mm (合格)' },
                  ]}
                />
              </Card>
            </>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Quality;
