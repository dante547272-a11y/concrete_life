/**
 * Billing & Reconciliation Page - 计费对账
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, DatePicker, Row, Col, Statistic, Tabs, Modal, Descriptions } from 'antd';
import { SearchOutlined, DownloadOutlined, PrinterOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

const { RangePicker } = DatePicker;

interface BillingRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  concreteGrade: string;
  totalVolume: number;
  unitPrice: number;
  totalAmount: number;
  deliveryCount: number;
  deliveryDate: string;
  status: 'pending' | 'confirmed' | 'invoiced' | 'paid';
}

interface ReconciliationRecord {
  id: string;
  month: string;
  customerName: string;
  orderCount: number;
  totalVolume: number;
  totalAmount: number;
  confirmedAmount: number;
  difference: number;
  status: 'pending' | 'confirmed' | 'disputed';
}

const mockBillingRecords: BillingRecord[] = [
  { id: '1', orderNumber: 'ORD20240115001', customerName: '广州建工集团', concreteGrade: 'C30', totalVolume: 48, unitPrice: 400, totalAmount: 19200, deliveryCount: 6, deliveryDate: '2024-01-15', status: 'confirmed' },
  { id: '2', orderNumber: 'ORD20240115002', customerName: '华南建设公司', concreteGrade: 'C40', totalVolume: 32, unitPrice: 520, totalAmount: 16640, deliveryCount: 4, deliveryDate: '2024-01-15', status: 'pending' },
  { id: '3', orderNumber: 'ORD20240114001', customerName: '广州建工集团', concreteGrade: 'C30', totalVolume: 64, unitPrice: 400, totalAmount: 25600, deliveryCount: 8, deliveryDate: '2024-01-14', status: 'invoiced' },
  { id: '4', orderNumber: 'ORD20240114002', customerName: '珠江建筑公司', concreteGrade: 'C35', totalVolume: 40, unitPrice: 450, totalAmount: 18000, deliveryCount: 5, deliveryDate: '2024-01-14', status: 'paid' },
  { id: '5', orderNumber: 'ORD20240113001', customerName: '华南建设公司', concreteGrade: 'C30', totalVolume: 56, unitPrice: 400, totalAmount: 22400, deliveryCount: 7, deliveryDate: '2024-01-13', status: 'paid' },
];

const mockReconciliationRecords: ReconciliationRecord[] = [
  { id: '1', month: '2024-01', customerName: '广州建工集团', orderCount: 15, totalVolume: 520, totalAmount: 208000, confirmedAmount: 208000, difference: 0, status: 'confirmed' },
  { id: '2', month: '2024-01', customerName: '华南建设公司', orderCount: 12, totalVolume: 380, totalAmount: 159600, confirmedAmount: 156000, difference: 3600, status: 'disputed' },
  { id: '3', month: '2024-01', customerName: '珠江建筑公司', orderCount: 8, totalVolume: 280, totalAmount: 126000, confirmedAmount: 126000, difference: 0, status: 'confirmed' },
  { id: '4', month: '2023-12', customerName: '广州建工集团', orderCount: 18, totalVolume: 620, totalAmount: 248000, confirmedAmount: 248000, difference: 0, status: 'confirmed' },
];

const billingStatusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  invoiced: 'purple',
  paid: 'green',
};

const billingStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  invoiced: '已开票',
  paid: '已付款',
};

const reconciliationStatusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'green',
  disputed: 'red',
};

const reconciliationStatusLabels: Record<string, string> = {
  pending: '待对账',
  confirmed: '已确认',
  disputed: '有争议',
};

const Billing: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('billing');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);

  const showDetail = (record: BillingRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const billingColumns: ColumnsType<BillingRecord> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => <a onClick={() => showDetail(record)}>{text}</a>,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '等级',
      dataIndex: 'concreteGrade',
      key: 'concreteGrade',
      render: (grade) => <Tag color="blue">{grade}</Tag>,
    },
    {
      title: '方量',
      dataIndex: 'totalVolume',
      key: 'totalVolume',
      render: (v) => `${v} m³`,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (p) => `¥${p}/m³`,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (a) => (
        <span style={{ fontFamily: 'Roboto Mono, monospace', color: 'var(--text-accent)' }}>
          ¥{a.toLocaleString()}
        </span>
      ),
    },
    {
      title: '车次',
      dataIndex: 'deliveryCount',
      key: 'deliveryCount',
      render: (c) => `${c} 车`,
    },
    {
      title: '日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={billingStatusColors[status]}>{billingStatusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckOutlined />}>
              确认
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const reconciliationColumns: ColumnsType<ReconciliationRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      render: (c) => `${c} 单`,
    },
    {
      title: '总方量',
      dataIndex: 'totalVolume',
      key: 'totalVolume',
      render: (v) => `${v} m³`,
    },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (a) => (
        <span style={{ fontFamily: 'Roboto Mono, monospace' }}>
          ¥{a.toLocaleString()}
        </span>
      ),
    },
    {
      title: '确认金额',
      dataIndex: 'confirmedAmount',
      key: 'confirmedAmount',
      render: (a) => (
        <span style={{ fontFamily: 'Roboto Mono, monospace' }}>
          ¥{a.toLocaleString()}
        </span>
      ),
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      render: (d) => (
        <span style={{ 
          fontFamily: 'Roboto Mono, monospace',
          color: d !== 0 ? 'var(--status-stopped)' : 'var(--status-running)',
        }}>
          {d !== 0 ? `¥${d.toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={reconciliationStatusColors[status]}>{reconciliationStatusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>查看明细</a>
          <a>导出</a>
        </Space>
      ),
    },
  ];

  const filteredBillingData = mockBillingRecords.filter((item) => {
    return !searchText || 
      item.orderNumber.includes(searchText) || 
      item.customerName.includes(searchText);
  });

  // Statistics
  const totalAmount = mockBillingRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const paidAmount = mockBillingRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalAmount, 0);
  const pendingAmount = mockBillingRecords.filter(r => r.status === 'pending' || r.status === 'confirmed').reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <AppLayout selectedKey="billing">
      <div style={{ padding: 0 }}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="本月应收" value={totalAmount} prefix="¥" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已收款" value={paidAmount} prefix="¥" valueStyle={{ color: 'var(--status-running)' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="待收款" value={pendingAmount} prefix="¥" valueStyle={{ color: 'var(--status-warning)' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="回款率" value={Math.round((paidAmount / totalAmount) * 100)} suffix="%" />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'billing',
                label: '订单计费',
                children: (
                  <>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Space>
                        <Input
                          placeholder="搜索订单号/客户"
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: 200 }}
                        />
                        <RangePicker />
                      </Space>
                      <Space>
                        <Button icon={<DownloadOutlined />}>导出</Button>
                        <Button icon={<PrinterOutlined />}>打印</Button>
                      </Space>
                    </div>
                    <Table
                      columns={billingColumns}
                      dataSource={filteredBillingData}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </>
                ),
              },
              {
                key: 'reconciliation',
                label: '月度对账',
                children: (
                  <>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Space>
                        <Input
                          placeholder="搜索客户"
                          prefix={<SearchOutlined />}
                          style={{ width: 200 }}
                        />
                        <DatePicker picker="month" />
                      </Space>
                      <Space>
                        <Button icon={<DownloadOutlined />}>导出对账单</Button>
                      </Space>
                    </div>
                    <Table
                      columns={reconciliationColumns}
                      dataSource={mockReconciliationRecords}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title={`订单详情 - ${selectedRecord?.orderNumber}`}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={600}
        >
          {selectedRecord && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="订单号">{selectedRecord.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="客户">{selectedRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="混凝土等级">{selectedRecord.concreteGrade}</Descriptions.Item>
              <Descriptions.Item label="总方量">{selectedRecord.totalVolume} m³</Descriptions.Item>
              <Descriptions.Item label="单价">¥{selectedRecord.unitPrice}/m³</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{selectedRecord.totalAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="配送车次">{selectedRecord.deliveryCount} 车</Descriptions.Item>
              <Descriptions.Item label="配送日期">{selectedRecord.deliveryDate}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={billingStatusColors[selectedRecord.status]}>{billingStatusLabels[selectedRecord.status]}</Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Billing;
