/**
 * Alarm Configuration Page - 告警配置
 * 配置告警颗粒度和告警方式
 */

import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, Switch, InputNumber, Tabs, Row, Col, Divider, message } from 'antd';
import { SettingOutlined, PlusOutlined, BellOutlined, MobileOutlined, MailOutlined, MessageOutlined, SoundOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface AlarmRule {
  id: string;
  name: string;
  category: 'temperature' | 'humidity' | 'speed' | 'pressure' | 'level' | 'quality' | 'equipment';
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'range';
  threshold: number;
  thresholdMax?: number;
  level: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notifyMethods: string[];
  description: string;
}

interface NotifyChannel {
  id: string;
  type: 'platform' | 'app' | 'sms' | 'email';
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  playSound?: boolean;
}

const categoryLabels: Record<string, string> = { temperature: '温度', humidity: '含水率', speed: '转速', pressure: '压力', level: '液位', quality: '质量', equipment: '设备状态' };
const conditionLabels: Record<string, string> = { gt: '大于', lt: '小于', eq: '等于', range: '范围' };
const levelConfig: Record<string, { color: string; text: string }> = { info: { color: 'blue', text: '提示' }, warning: { color: 'orange', text: '警告' }, critical: { color: 'red', text: '严重' } };
const channelConfig: Record<string, { icon: React.ReactNode; label: string }> = { platform: { icon: <BellOutlined />, label: '平台告警' }, app: { icon: <MobileOutlined />, label: '手机APP' }, sms: { icon: <MessageOutlined />, label: '短信告警' }, email: { icon: <MailOutlined />, label: '邮件告警' } };

const mockRules: AlarmRule[] = [
  { id: '1', name: '搅拌机温度过高', category: 'temperature', metric: '搅拌机轴承温度', condition: 'gt', threshold: 80, level: 'critical', enabled: true, notifyMethods: ['platform', 'app', 'sms'], description: '搅拌机轴承温度超过80°C时触发严重告警' },
  { id: '2', name: '骨料含水率异常', category: 'humidity', metric: '砂含水率', condition: 'range', threshold: 3, thresholdMax: 8, level: 'warning', enabled: true, notifyMethods: ['platform', 'app'], description: '砂含水率不在3%-8%范围内时触发警告' },
  { id: '3', name: '皮带机转速异常', category: 'speed', metric: '骨料皮带机转速', condition: 'lt', threshold: 100, level: 'warning', enabled: true, notifyMethods: ['platform'], description: '皮带机转速低于100rpm时触发警告' },
  { id: '4', name: '气压过低', category: 'pressure', metric: '气源系统压力', condition: 'lt', threshold: 0.5, level: 'critical', enabled: true, notifyMethods: ['platform', 'app', 'sms', 'email'], description: '气源压力低于0.5MPa时触发严重告警' },
  { id: '5', name: '污水池液位过高', category: 'level', metric: '收集池液位', condition: 'gt', threshold: 85, level: 'warning', enabled: true, notifyMethods: ['platform', 'app'], description: '收集池液位超过85%时触发警告' },
  { id: '6', name: '混凝土坍落度异常', category: 'quality', metric: '坍落度', condition: 'range', threshold: 160, thresholdMax: 200, level: 'warning', enabled: false, notifyMethods: ['platform'], description: '坍落度不在160-200mm范围内时触发警告' },
  { id: '7', name: '设备离线', category: 'equipment', metric: '设备在线状态', condition: 'eq', threshold: 0, level: 'info', enabled: true, notifyMethods: ['platform'], description: '设备离线时触发提示' },
];

const mockChannels: NotifyChannel[] = [
  { id: 'c1', type: 'platform', name: '平台告警', enabled: true, config: {}, playSound: true },
  { id: 'c2', type: 'app', name: '手机APP推送', enabled: true, config: { pushEnabled: true } },
  { id: 'c3', type: 'sms', name: '短信告警', enabled: true, config: { phones: ['138****1234', '139****5678'] } },
  { id: 'c4', type: 'email', name: '邮件告警', enabled: false, config: { emails: ['admin@example.com'] } },
];

const AlarmConfig: React.FC = () => {
  const [rules, setRules] = useState<AlarmRule[]>(mockRules);
  const [channels, setChannels] = useState<NotifyChannel[]>(mockChannels);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AlarmRule | null>(null);
  const [form] = Form.useForm();

  const handleAddRule = () => { setEditingRule(null); form.resetFields(); setRuleModalVisible(true); };
  const handleEditRule = (rule: AlarmRule) => { setEditingRule(rule); form.setFieldsValue(rule); setRuleModalVisible(true); };
  const handleDeleteRule = (id: string) => { setRules(rules.filter(r => r.id !== id)); message.success('删除成功'); };
  const handleToggleRule = (id: string, enabled: boolean) => { setRules(rules.map(r => r.id === id ? { ...r, enabled } : r)); };
  const handleToggleChannel = (id: string, enabled: boolean) => { setChannels(channels.map(c => c.id === id ? { ...c, enabled } : c)); };
  const handleToggleSound = (id: string, playSound: boolean) => { setChannels(channels.map(c => c.id === id ? { ...c, playSound } : c)); };

  const handleSaveRule = () => {
    form.validateFields().then(values => {
      if (editingRule) {
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...values } : r));
        message.success('修改成功');
      } else {
        setRules([...rules, { ...values, id: Date.now().toString() }]);
        message.success('添加成功');
      }
      setRuleModalVisible(false);
    });
  };

  const ruleColumns: ColumnsType<AlarmRule> = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '类别', dataIndex: 'category', key: 'category', render: (cat) => <Tag>{categoryLabels[cat]}</Tag> },
    { title: '监控指标', dataIndex: 'metric', key: 'metric' },
    { title: '触发条件', key: 'condition', render: (_, r) => r.condition === 'range' ? `${r.threshold} - ${r.thresholdMax}` : `${conditionLabels[r.condition]} ${r.threshold}` },
    { title: '告警级别', dataIndex: 'level', key: 'level', render: (level) => <Tag color={levelConfig[level].color}>{levelConfig[level].text}</Tag> },
    { title: '通知方式', dataIndex: 'notifyMethods', key: 'notifyMethods', render: (methods: string[]) => methods.map(m => <Tag key={m} icon={channelConfig[m]?.icon}>{channelConfig[m]?.label}</Tag>) },
    { title: '状态', key: 'enabled', render: (_, r) => <Switch checked={r.enabled} onChange={(v) => handleToggleRule(r.id, v)} checkedChildren="启用" unCheckedChildren="禁用" /> },
    { title: '操作', key: 'action', render: (_, r) => <Space><Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRule(r)}>编辑</Button><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(r.id)}>删除</Button></Space> },
  ];

  const RulesTab = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-secondary)' }}>配置告警触发规则，包括监控指标、阈值和告警级别</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>新增规则</Button>
      </div>
      <Table columns={ruleColumns} dataSource={rules} rowKey="id" pagination={false} />
    </div>
  );

  const ChannelsTab = () => (
    <Row gutter={16}>
      {channels.map(channel => (
        <Col span={12} key={channel.id}>
          <Card title={<Space>{channelConfig[channel.type].icon}{channel.name}</Space>} extra={<Switch checked={channel.enabled} onChange={(v) => handleToggleChannel(channel.id, v)} checkedChildren="启用" unCheckedChildren="禁用" />} style={{ marginBottom: 16 }}>
            {channel.type === 'platform' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Space><SoundOutlined />播放报警音：<Switch checked={channel.playSound} onChange={(v) => handleToggleSound(channel.id, v)} checkedChildren="开" unCheckedChildren="关" /></Space>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>平台告警将在系统内显示告警通知，可配置是否播放报警提示音</div>
              </div>
            )}
            {channel.type === 'app' && (
              <div>
                <div style={{ marginBottom: 8 }}>推送状态：<Tag color="green">已连接</Tag></div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>通过手机APP接收告警推送通知</div>
              </div>
            )}
            {channel.type === 'sms' && (
              <div>
                <div style={{ marginBottom: 8 }}>接收号码：{(channel.config.phones as string[])?.join(', ')}</div>
                <Button type="link" size="small" style={{ padding: 0 }}>管理接收人</Button>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>通过短信发送告警通知，适用于严重告警</div>
              </div>
            )}
            {channel.type === 'email' && (
              <div>
                <div style={{ marginBottom: 8 }}>接收邮箱：{(channel.config.emails as string[])?.join(', ')}</div>
                <Button type="link" size="small" style={{ padding: 0 }}>管理接收人</Button>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>通过邮件发送告警详情，包含完整告警信息</div>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <AppLayout selectedKey="alarm-config">
      <Card title={<Space><SettingOutlined />告警配置</Space>}>
        <Tabs items={[
          { key: 'rules', label: '告警规则', children: <RulesTab /> },
          { key: 'channels', label: '通知渠道', children: <ChannelsTab /> },
        ]} />
      </Card>

      <Modal title={editingRule ? '编辑告警规则' : '新增告警规则'} open={ruleModalVisible} onOk={handleSaveRule} onCancel={() => setRuleModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}><Input placeholder="请输入规则名称" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="category" label="告警类别" rules={[{ required: true }]}><Select options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))} placeholder="选择类别" /></Form.Item></Col>
            <Col span={12}><Form.Item name="metric" label="监控指标" rules={[{ required: true }]}><Input placeholder="请输入监控指标" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="condition" label="触发条件" rules={[{ required: true }]}><Select options={Object.entries(conditionLabels).map(([k, v]) => ({ value: k, label: v }))} placeholder="选择条件" /></Form.Item></Col>
            <Col span={8}><Form.Item name="threshold" label="阈值" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} placeholder="阈值" /></Form.Item></Col>
            <Col span={8}><Form.Item name="thresholdMax" label="最大值(范围)"><InputNumber style={{ width: '100%' }} placeholder="范围最大值" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="level" label="告警级别" rules={[{ required: true }]}><Select options={Object.entries(levelConfig).map(([k, v]) => ({ value: k, label: v.text }))} placeholder="选择级别" /></Form.Item></Col>
            <Col span={12}><Form.Item name="notifyMethods" label="通知方式" rules={[{ required: true }]}><Select mode="multiple" options={Object.entries(channelConfig).map(([k, v]) => ({ value: k, label: v.label }))} placeholder="选择通知方式" /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="规则描述"><Input.TextArea rows={2} placeholder="请输入规则描述" /></Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}><Switch checkedChildren="启用" unCheckedChildren="禁用" /></Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default AlarmConfig;
