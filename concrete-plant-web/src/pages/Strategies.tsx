/**
 * Strategies Management Page - 策略管理
 * 混凝土自动矫正策略配置
 */

import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Switch, Modal, Form, Input, Select, InputNumber, Descriptions, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface Strategy {
  id: string;
  name: string;
  type: 'moisture' | 'slump' | 'temperature' | 'strength' | 'aggregate' | 'ai';
  description: string;
  enabled: boolean;
  priority: number;
  conditions: StrategyCondition[];
  actions: StrategyAction[];
  createdAt: string;
  updatedAt: string;
}

interface StrategyCondition {
  parameter: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
  value: number | [number, number];
  unit: string;
}

interface StrategyAction {
  type: 'adjust_water' | 'adjust_additive' | 'adjust_aggregate' | 'alert' | 'stop';
  parameter?: string;
  value?: number;
  unit?: string;
  message?: string;
}

const typeLabels: Record<string, string> = {
  moisture: '含水率矫正',
  slump: '坍落度矫正',
  temperature: '温度补偿',
  strength: '强度调整',
  aggregate: '骨料配比',
  ai: 'AI智能策略',
};

const typeColors: Record<string, string> = {
  moisture: 'blue',
  slump: 'green',
  temperature: 'orange',
  strength: 'purple',
  aggregate: 'cyan',
  ai: 'magenta',
};

const operatorLabels: Record<string, string> = {
  gt: '>',
  lt: '<',
  eq: '=',
  gte: '≥',
  lte: '≤',
  between: '介于',
};

const mockStrategies: Strategy[] = [
  {
    id: '1',
    name: '砂含水率自动补偿',
    type: 'moisture',
    description: '根据砂的实际含水率自动调整用水量，保证混凝土水灰比稳定',
    enabled: true,
    priority: 1,
    conditions: [
      { parameter: '砂含水率', operator: 'gt', value: 5, unit: '%' },
    ],
    actions: [
      { type: 'adjust_water', parameter: '用水量', value: -1, unit: 'kg/%' },
      { type: 'adjust_aggregate', parameter: '砂用量', value: 1, unit: 'kg/%' },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    name: '坍落度偏小矫正',
    type: 'slump',
    description: '当检测到坍落度低于目标值时，自动增加减水剂用量',
    enabled: true,
    priority: 2,
    conditions: [
      { parameter: '坍落度偏差', operator: 'lt', value: -20, unit: 'mm' },
    ],
    actions: [
      { type: 'adjust_additive', parameter: '减水剂', value: 0.1, unit: 'kg' },
    ],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    name: '坍落度偏大矫正',
    type: 'slump',
    description: '当检测到坍落度高于目标值时，减少用水量或减水剂',
    enabled: true,
    priority: 3,
    conditions: [
      { parameter: '坍落度偏差', operator: 'gt', value: 20, unit: 'mm' },
    ],
    actions: [
      { type: 'adjust_water', parameter: '用水量', value: -2, unit: 'kg' },
    ],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-10',
  },
  {
    id: '4',
    name: '高温天气补偿',
    type: 'temperature',
    description: '环境温度超过30°C时，自动增加缓凝剂用量，防止混凝土过快凝结',
    enabled: true,
    priority: 4,
    conditions: [
      { parameter: '环境温度', operator: 'gt', value: 30, unit: '°C' },
    ],
    actions: [
      { type: 'adjust_additive', parameter: '缓凝剂', value: 0.5, unit: 'kg' },
      { type: 'alert', message: '高温天气，已自动增加缓凝剂' },
    ],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-12',
  },
  {
    id: '5',
    name: '低温天气补偿',
    type: 'temperature',
    description: '环境温度低于5°C时，自动增加早强剂用量',
    enabled: false,
    priority: 5,
    conditions: [
      { parameter: '环境温度', operator: 'lt', value: 5, unit: '°C' },
    ],
    actions: [
      { type: 'adjust_additive', parameter: '早强剂', value: 1.0, unit: 'kg' },
      { type: 'alert', message: '低温天气，已自动增加早强剂' },
    ],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
  },
  {
    id: '6',
    name: '骨料超差停机',
    type: 'aggregate',
    description: '当骨料计量偏差超过允许范围时，自动停止生产并报警',
    enabled: true,
    priority: 0,
    conditions: [
      { parameter: '骨料偏差', operator: 'gt', value: 5, unit: '%' },
    ],
    actions: [
      { type: 'stop' },
      { type: 'alert', message: '骨料计量超差，已自动停机' },
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-14',
  },
  {
    id: '7',
    name: 'AI智能配比管理',
    type: 'ai',
    description: '全自动AI完成配比管理，根据历史数据和实时参数智能优化配方',
    enabled: true,
    priority: 1,
    conditions: [
      { parameter: 'AI分析', operator: 'eq', value: 1, unit: '' },
    ],
    actions: [
      { type: 'adjust_water', parameter: '用水量', value: 0, unit: 'kg (智能调整)' },
      { type: 'adjust_additive', parameter: '外加剂', value: 0, unit: 'kg (智能调整)' },
      { type: 'adjust_aggregate', parameter: '骨料配比', value: 0, unit: '% (智能调整)' },
      { type: 'alert', message: 'AI已完成配比优化' },
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
];

const Strategies: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [form] = Form.useForm();

  const handleToggle = (id: string, enabled: boolean) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
  };

  const handleAdd = () => {
    setSelectedStrategy(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Strategy) => {
    setSelectedStrategy(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      description: record.description,
      priority: record.priority,
    });
    setModalVisible(true);
  };

  const handleDetail = (record: Strategy) => {
    setSelectedStrategy(record);
    setDetailVisible(true);
  };

  const formatCondition = (cond: StrategyCondition) => {
    if (cond.operator === 'between' && Array.isArray(cond.value)) {
      return `${cond.parameter} ${cond.value[0]}${cond.unit} ~ ${cond.value[1]}${cond.unit}`;
    }
    return `${cond.parameter} ${operatorLabels[cond.operator]} ${cond.value}${cond.unit}`;
  };

  const formatAction = (action: StrategyAction) => {
    switch (action.type) {
      case 'adjust_water':
      case 'adjust_additive':
      case 'adjust_aggregate':
        return `调整${action.parameter}: ${action.value! > 0 ? '+' : ''}${action.value}${action.unit}`;
      case 'alert':
        return `发送告警: ${action.message}`;
      case 'stop':
        return '停止生产';
      default:
        return '';
    }
  };

  const columns: ColumnsType<Strategy> = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <ThunderboltOutlined style={{ color: record.enabled ? '#52c41a' : '#999' }} />
          <a onClick={() => handleDetail(record)}>{name}</a>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>,
      filters: Object.entries(typeLabels).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '触发条件',
      key: 'conditions',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.conditions.map((c, i) => (
            <span key={i} style={{ fontSize: 12 }}>{formatCondition(c)}</span>
          ))}
        </Space>
      ),
    },
    {
      title: '执行动作',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.actions.slice(0, 2).map((a, i) => (
            <span key={i} style={{ fontSize: 12 }}>{formatAction(a)}</span>
          ))}
          {record.actions.length > 2 && <span style={{ fontSize: 12, color: '#999' }}>+{record.actions.length - 2} 更多</span>}
        </Space>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (p) => <Tag>{p === 0 ? '最高' : p}</Tag>,
    },
    {
      title: '状态',
      key: 'enabled',
      render: (_, record) => (
        <Switch 
          checked={record.enabled} 
          onChange={(checked) => handleToggle(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<InfoCircleOutlined />} onClick={() => handleDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout selectedKey="strategies">
      <div style={{ padding: 0 }}>
        <Card
          title={
            <Space>
              <ThunderboltOutlined />
              策略管理
            </Space>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建策略</Button>
          }
        >
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }}>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              策略按优先级从高到低执行，优先级为0表示最高优先级。当多个策略同时触发时，高优先级策略优先执行。
            </span>
          </div>
          <Table
            columns={columns}
            dataSource={strategies}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={selectedStrategy ? '编辑策略' : '新建策略'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => { form.validateFields().then(() => setModalVisible(false)); }}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
              <Input placeholder="请输入策略名称" />
            </Form.Item>
            <Form.Item name="type" label="策略类型" rules={[{ required: true, message: '请选择策略类型' }]}>
              <Select placeholder="请选择策略类型" options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))} />
            </Form.Item>
            <Form.Item name="description" label="策略描述">
              <Input.TextArea rows={3} placeholder="请输入策略描述" />
            </Form.Item>
            <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请输入优先级' }]}>
              <InputNumber min={0} max={99} placeholder="0为最高优先级" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={selectedStrategy?.name}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          width={650}
        >
          {selectedStrategy && (
            <>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="策略类型">
                  <Tag color={typeColors[selectedStrategy.type]}>{typeLabels[selectedStrategy.type]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selectedStrategy.enabled ? 'green' : 'default'}>
                    {selectedStrategy.enabled ? '已启用' : '已禁用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="优先级">{selectedStrategy.priority === 0 ? '最高' : selectedStrategy.priority}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedStrategy.updatedAt}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{selectedStrategy.description}</Descriptions.Item>
              </Descriptions>

              <Card title="触发条件" size="small" style={{ marginBottom: 16 }}>
                {selectedStrategy.conditions.map((c, i) => (
                  <Tag key={i} style={{ marginBottom: 4 }}>{formatCondition(c)}</Tag>
                ))}
              </Card>

              <Card title="执行动作" size="small">
                {selectedStrategy.actions.map((a, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: i < selectedStrategy.actions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    {formatAction(a)}
                  </div>
                ))}
              </Card>
            </>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Strategies;
