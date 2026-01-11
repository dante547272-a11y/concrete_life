/**
 * Alarms Center Page - 告警中心
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Select, Row, Col, Statistic, Badge, Timeline, Modal } from 'antd';
import { SearchOutlined, CheckOutlined, BellOutlined, WarningOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SoundOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface Alarm {
  id: string;
  type: 'critical' | 'warning' | 'info';
  source: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
}

const mockAlarms: Alarm[] = [
  { id: '1', type: 'critical', source: '骨料仓3', message: '库存低于警戒线 (15%)', timestamp: '2024-01-15 10:45:32', acknowledged: false, resolved: false },
  { id: '2', type: 'warning', source: '矿粉仓', message: '库存偏低 (28%)', timestamp: '2024-01-15 10:30:15', acknowledged: true, acknowledgedBy: '张三', acknowledgedAt: '10:32:00', resolved: false },
  { id: '3', type: 'critical', source: '搅拌机', message: '电机过载保护触发', timestamp: '2024-01-15 09:15:22', acknowledged: true, acknowledgedBy: '李四', acknowledgedAt: '09:16:00', resolved: true, resolvedAt: '09:25:00' },
  { id: '4', type: 'warning', source: '骨料秤1', message: '称重偏差超过3%', timestamp: '2024-01-15 08:45:10', acknowledged: true, acknowledgedBy: '张三', acknowledgedAt: '08:46:00', resolved: true, resolvedAt: '08:50:00' },
  { id: '5', type: 'info', source: '系统', message: 'WebSocket连接已恢复', timestamp: '2024-01-15 08:30:00', acknowledged: true, acknowledgedBy: '系统', acknowledgedAt: '08:30:00', resolved: true, resolvedAt: '08:30:00' },
  { id: '6', type: 'warning', source: '水泥仓', message: '温度传感器异常', timestamp: '2024-01-15 07:20:45', acknowledged: true, acknowledgedBy: '王五', acknowledgedAt: '07:22:00', resolved: true, resolvedAt: '07:45:00' },
  { id: '7', type: 'critical', source: '减水剂泵', message: '泵压力异常', timestamp: '2024-01-14 16:30:22', acknowledged: true, acknowledgedBy: '李四', acknowledgedAt: '16:31:00', resolved: true, resolvedAt: '16:45:00' },
];

const typeIcons = {
  critical: <CloseCircleOutlined style={{ color: 'var(--status-stopped)' }} />,
  warning: <ExclamationCircleOutlined style={{ color: 'var(--status-warning)' }} />,
  info: <BellOutlined style={{ color: 'var(--text-accent)' }} />,
};

const typeColors = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

const typeLabels = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

const Alarms: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

  const showDetail = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setDetailVisible(true);
  };

  const columns: ColumnsType<Alarm> = [
    {
      title: '级别',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Space>
          {typeIcons[type as keyof typeof typeIcons]}
          <Tag color={typeColors[type as keyof typeof typeColors]}>{typeLabels[type as keyof typeof typeLabels]}</Tag>
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
    },
    {
      title: '告警信息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.resolved) {
          return <Tag color="green">已解决</Tag>;
        }
        if (record.acknowledged) {
          return <Tag color="blue">已确认</Tag>;
        }
        return <Badge status="processing" text={<span style={{ color: 'var(--status-stopped)' }}>未处理</span>} />;
      },
    },
    {
      title: '处理人',
      key: 'handler',
      width: 100,
      render: (_, record) => record.acknowledgedBy || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {!record.acknowledged && (
            <Button type="link" size="small" icon={<CheckOutlined />}>
              确认
            </Button>
          )}
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const filteredData = mockAlarms.filter((item) => {
    const matchSearch = !searchText || item.message.includes(searchText) || item.source.includes(searchText);
    const matchType = !typeFilter || item.type === typeFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === 'unacknowledged' && !item.acknowledged) ||
      (statusFilter === 'acknowledged' && item.acknowledged && !item.resolved) ||
      (statusFilter === 'resolved' && item.resolved);
    return matchSearch && matchType && matchStatus;
  });

  // Statistics
  const unacknowledgedCount = mockAlarms.filter(a => !a.acknowledged).length;
  const criticalCount = mockAlarms.filter(a => a.type === 'critical' && !a.resolved).length;
  const warningCount = mockAlarms.filter(a => a.type === 'warning' && !a.resolved).length;
  const todayCount = mockAlarms.filter(a => a.timestamp.startsWith('2024-01-15')).length;

  return (
    <AppLayout selectedKey="alarms">
      <div style={{ padding: 0 }}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="未处理告警" 
                value={unacknowledgedCount} 
                suffix="条"
                valueStyle={{ color: unacknowledgedCount > 0 ? 'var(--status-stopped)' : undefined }}
                prefix={unacknowledgedCount > 0 ? <WarningOutlined /> : undefined}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="严重告警" 
                value={criticalCount} 
                suffix="条"
                valueStyle={{ color: criticalCount > 0 ? 'var(--status-stopped)' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="警告" 
                value={warningCount} 
                suffix="条"
                valueStyle={{ color: warningCount > 0 ? 'var(--status-warning)' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日告警" value={todayCount} suffix="条" />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <Space>
              <SoundOutlined />
              告警中心
              {unacknowledgedCount > 0 && <Badge count={unacknowledgedCount} />}
            </Space>
          }
          extra={
            <Space>
              <Input
                placeholder="搜索告警"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="告警级别"
                allowClear
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'critical', label: '严重' },
                  { value: 'warning', label: '警告' },
                  { value: 'info', label: '信息' },
                ]}
              />
              <Select
                placeholder="处理状态"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'unacknowledged', label: '未处理' },
                  { value: 'acknowledged', label: '已确认' },
                  { value: 'resolved', label: '已解决' },
                ]}
              />
              <Button>全部确认</Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            rowClassName={(record) => !record.acknowledged ? 'alarm-row-unacknowledged' : ''}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title="告警详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={600}
        >
          {selectedAlarm && (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    {typeIcons[selectedAlarm.type]}
                    <Tag color={typeColors[selectedAlarm.type]}>{typeLabels[selectedAlarm.type]}</Tag>
                    <span style={{ fontWeight: 600 }}>{selectedAlarm.source}</span>
                  </Space>
                  <div style={{ fontSize: 16 }}>{selectedAlarm.message}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>触发时间: {selectedAlarm.timestamp}</div>
                </Space>
              </Card>

              <Card title="处理时间线" size="small">
                <Timeline
                  items={[
                    { 
                      color: 'red', 
                      children: `告警触发 - ${selectedAlarm.timestamp}` 
                    },
                    ...(selectedAlarm.acknowledged ? [{
                      color: 'blue',
                      children: `已确认 - ${selectedAlarm.acknowledgedAt} (${selectedAlarm.acknowledgedBy})`,
                    }] : []),
                    ...(selectedAlarm.resolved ? [{
                      color: 'green',
                      children: `已解决 - ${selectedAlarm.resolvedAt}`,
                    }] : []),
                  ]}
                />
              </Card>
            </>
          )}
        </Modal>

        <style>{`
          .alarm-row-unacknowledged {
            background: rgba(255, 71, 87, 0.1) !important;
          }
          .alarm-row-unacknowledged:hover > td {
            background: rgba(255, 71, 87, 0.15) !important;
          }
        `}</style>
      </div>
    </AppLayout>
  );
};

export default Alarms;
