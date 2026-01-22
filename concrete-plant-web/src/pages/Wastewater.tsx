/**
 * Wastewater Management Page - 零排放污水管理
 */

import React from 'react';
import { Card, Table, Tag, Progress, Space, Button, Statistic, Row, Col } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface WastewaterTank {
  id: string; name: string; type: 'collection' | 'settling' | 'recycling' | 'sludge';
  capacity: number; currentLevel: number; status: 'normal' | 'warning' | 'critical' | 'maintenance';
  ph: number; turbidity: number; lastCleanDate: string; nextCleanDate: string;
}
interface WastewaterPump {
  id: string; name: string; location: string; status: 'running' | 'standby' | 'fault' | 'maintenance';
  flowRate: number; pressure: number; runningHours: number; power: number;
}

const mockTanks: WastewaterTank[] = [
  { id: 't1', name: '1号收集池', type: 'collection', capacity: 50, currentLevel: 35, status: 'normal', ph: 7.2, turbidity: 120, lastCleanDate: '2025-12-15', nextCleanDate: '2026-01-15' },
  { id: 't2', name: '2号收集池', type: 'collection', capacity: 50, currentLevel: 42, status: 'warning', ph: 7.8, turbidity: 180, lastCleanDate: '2025-12-10', nextCleanDate: '2026-01-10' },
  { id: 't3', name: '沉淀池A', type: 'settling', capacity: 100, currentLevel: 65, status: 'normal', ph: 7.5, turbidity: 45, lastCleanDate: '2025-11-20', nextCleanDate: '2026-02-20' },
  { id: 't4', name: '沉淀池B', type: 'settling', capacity: 100, currentLevel: 78, status: 'warning', ph: 7.6, turbidity: 52, lastCleanDate: '2025-11-25', nextCleanDate: '2026-02-25' },
  { id: 't5', name: '回用水池', type: 'recycling', capacity: 80, currentLevel: 55, status: 'normal', ph: 7.0, turbidity: 8, lastCleanDate: '2025-12-01', nextCleanDate: '2026-03-01' },
  { id: 't6', name: '污泥池', type: 'sludge', capacity: 30, currentLevel: 22, status: 'warning', ph: 6.8, turbidity: 500, lastCleanDate: '2025-12-20', nextCleanDate: '2026-01-05' },
];

const mockPumps: WastewaterPump[] = [
  { id: 'p1', name: '收集泵1#', location: '收集池区', status: 'running', flowRate: 25, pressure: 0.35, runningHours: 4520, power: 5.5 },
  { id: 'p2', name: '收集泵2#', location: '收集池区', status: 'standby', flowRate: 0, pressure: 0, runningHours: 3800, power: 5.5 },
  { id: 'p3', name: '沉淀泵1#', location: '沉淀池区', status: 'running', flowRate: 18, pressure: 0.28, runningHours: 5200, power: 4.0 },
  { id: 'p4', name: '回用泵1#', location: '回用水池', status: 'running', flowRate: 30, pressure: 0.45, runningHours: 6100, power: 7.5 },
  { id: 'p5', name: '污泥泵1#', location: '污泥池', status: 'fault', flowRate: 0, pressure: 0, runningHours: 2800, power: 3.0 },
];

const tankTypeLabels: Record<string, string> = { collection: '收集池', settling: '沉淀池', recycling: '回用水池', sludge: '污泥池' };
const statusConfig: Record<string, { color: string; text: string }> = { normal: { color: 'green', text: '正常' }, warning: { color: 'orange', text: '关注' }, critical: { color: 'red', text: '异常' }, maintenance: { color: 'blue', text: '维护中' } };
const pumpStatusConfig: Record<string, { color: string; text: string }> = { running: { color: 'green', text: '运行中' }, standby: { color: 'blue', text: '待机' }, fault: { color: 'red', text: '故障' }, maintenance: { color: 'orange', text: '维护中' } };

const Wastewater: React.FC = () => {
  const tankColumns: ColumnsType<WastewaterTank> = [
    { title: '池名称', dataIndex: 'name', key: 'name', render: (name) => <Space><ExperimentOutlined style={{ color: '#1890ff' }} />{name}</Space> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag>{tankTypeLabels[type]}</Tag> },
    { title: '容量/液位', key: 'level', render: (_, record) => <Progress percent={Math.round(record.currentLevel / record.capacity * 100)} size="small" format={() => `${record.currentLevel}/${record.capacity}m³`} strokeColor={record.currentLevel / record.capacity > 0.85 ? '#f5222d' : record.currentLevel / record.capacity > 0.7 ? '#faad14' : '#52c41a'} /> },
    { title: 'pH值', dataIndex: 'ph', key: 'ph', render: (ph) => <span style={{ color: ph < 6.5 || ph > 8.5 ? '#f5222d' : '#52c41a' }}>{ph}</span> },
    { title: '浊度(NTU)', dataIndex: 'turbidity', key: 'turbidity', render: (t) => <span style={{ color: t > 100 ? '#faad14' : '#52c41a' }}>{t}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag> },
    { title: '下次清理', dataIndex: 'nextCleanDate', key: 'nextCleanDate' },
    { title: '操作', key: 'action', render: () => <Space><Button type="link" size="small">详情</Button><Button type="link" size="small">清理记录</Button></Space> },
  ];
  const pumpColumns: ColumnsType<WastewaterPump> = [
    { title: '泵名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => <Tag color={pumpStatusConfig[status].color}>{pumpStatusConfig[status].text}</Tag> },
    { title: '流量(m³/h)', dataIndex: 'flowRate', key: 'flowRate' },
    { title: '压力(MPa)', dataIndex: 'pressure', key: 'pressure' },
    { title: '功率(kW)', dataIndex: 'power', key: 'power' },
    { title: '运行时间(h)', dataIndex: 'runningHours', key: 'runningHours', render: (h) => h.toLocaleString() },
    { title: '操作', key: 'action', render: (_, record) => <Space><Button type="link" size="small">{record.status === 'running' ? '停止' : '启动'}</Button><Button type="link" size="small">维护</Button></Space> },
  ];
  const tankStats = { total: mockTanks.length, normal: mockTanks.filter(t => t.status === 'normal').length, warning: mockTanks.filter(t => t.status === 'warning').length, recycledToday: 125 };
  const pumpStats = { running: mockPumps.filter(p => p.status === 'running').length, fault: mockPumps.filter(p => p.status === 'fault').length };

  return (
    <AppLayout selectedKey="wastewater">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card size="small"><Statistic title="水池总数" value={tankStats.total} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="正常水池" value={tankStats.normal} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="需关注水池" value={tankStats.warning} valueStyle={{ color: '#faad14' }} prefix={<ExclamationCircleOutlined />} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="今日回用水量" value={tankStats.recycledToday} suffix="m³" valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="运行中水泵" value={pumpStats.running} valueStyle={{ color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="故障水泵" value={pumpStats.fault} valueStyle={{ color: '#f5222d' }} prefix={<WarningOutlined />} /></Card></Col>
      </Row>
      <Card title={<Space><ExperimentOutlined />水池管理</Space>} style={{ marginBottom: 16 }}>
        <Table columns={tankColumns} dataSource={mockTanks} rowKey="id" pagination={false} size="small" />
      </Card>
      <Card title={<Space><ThunderboltOutlined />水泵管理</Space>}>
        <Table columns={pumpColumns} dataSource={mockPumps} rowKey="id" pagination={false} size="small" />
      </Card>
    </AppLayout>
  );
};

export default Wastewater;
