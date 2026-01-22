/**
 * Orders Management Page - 订单管理
 * 包含本地订单管理和远端订单同步功能
 */

import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, DatePicker, Card, Modal, Form, InputNumber, Select, Tabs, message, Descriptions, Switch, Badge } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CloudSyncOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ApiOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  concreteGrade: string;
  volume: number;
  deliveryAddress: string;
  contactPhone: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  source: 'local' | 'remote';
  createdAt: string;
  requiredDate: string;
}

interface RemoteConfig {
  enabled: boolean;
  url: string;
  apiKey: string;
  syncInterval: number; // 分钟
  lastSyncTime: string | null;
}

const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD20240115001', customerName: '建设公司A', concreteGrade: 'C30', volume: 50, deliveryAddress: '杭州市余杭区良渚街道工地A', contactPhone: '13800138001', status: 'in_progress', source: 'local', createdAt: '2024-01-15', requiredDate: '2024-01-16' },
  { id: '2', orderNumber: 'ORD20240115002', customerName: '建设公司B', concreteGrade: 'C40', volume: 30, deliveryAddress: '杭州市西湖区工地B', contactPhone: '13800138002', status: 'pending', source: 'local', createdAt: '2024-01-15', requiredDate: '2024-01-17' },
  { id: '3', orderNumber: 'ORD20240114001', customerName: '建设公司C', concreteGrade: 'C25', volume: 80, deliveryAddress: '杭州市拱墅区工地C', contactPhone: '13800138003', status: 'completed', source: 'local', createdAt: '2024-01-14', requiredDate: '2024-01-15' },
  { id: '4', orderNumber: 'RMT20240115001', customerName: '远程客户D', concreteGrade: 'C35', volume: 60, deliveryAddress: '杭州市滨江区工地D', contactPhone: '13800138004', status: 'confirmed', source: 'remote', createdAt: '2024-01-15', requiredDate: '2024-01-18' },
  { id: '5', orderNumber: 'RMT20240115002', customerName: '远程客户E', concreteGrade: 'C30', volume: 45, deliveryAddress: '杭州市萧山区工地E', contactPhone: '13800138005', status: 'pending', source: 'remote', createdAt: '2024-01-15', requiredDate: '2024-01-19' },
];

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  in_progress: { color: 'processing', text: '生产中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
};

const concreteGrades = ['C15', 'C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50'];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [remoteConfigVisible, setRemoteConfigVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [form] = Form.useForm();
  const [remoteForm] = Form.useForm();
  
  const [remoteConfig, setRemoteConfig] = useState<RemoteConfig>({
    enabled: true,
    url: 'https://api.example.com/orders',
    apiKey: 'sk-xxxx-xxxx-xxxx',
    syncInterval: 5,
    lastSyncTime: '2024-01-15 14:30:00',
  });

  // 过滤订单
  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Order) => {
    setSelectedOrder(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDetail = (record: Order) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  const handleDelete = (record: Order) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除订单 "${record.orderNumber}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setOrders(prev => prev.filter(o => o.id !== record.id));
        message.success('订单已删除');
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (selectedOrder) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...values } : o));
        message.success('订单已更新');
      } else {
        const newOrder: Order = {
          ...values,
          id: Date.now().toString(),
          orderNumber: `ORD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(orders.length + 1).padStart(3, '0')}`,
          source: 'local',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setOrders(prev => [...prev, newOrder]);
        message.success('订单已创建');
      }
      setModalVisible(false);
    } catch (error) {
      // Form validation failed
    }
  };

  const handleStatusChange = (record: Order, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === record.id ? { ...o, status: newStatus as Order['status'] } : o));
    message.success(`订单状态已更新为: ${statusConfig[newStatus].text}`);
  };

  // 远端同步
  const handleSync = async () => {
    if (!remoteConfig.enabled || !remoteConfig.url) {
      message.warning('请先配置远端同步');
      return;
    }
    
    setSyncing(true);
    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟获取新订单
    const newRemoteOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `RMT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      customerName: `远程客户${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      concreteGrade: concreteGrades[Math.floor(Math.random() * concreteGrades.length)],
      volume: Math.floor(Math.random() * 100) + 20,
      deliveryAddress: '杭州市某区某街道工地',
      contactPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status: 'pending',
      source: 'remote',
      createdAt: new Date().toISOString().split('T')[0],
      requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    
    setOrders(prev => [...prev, newRemoteOrder]);
    setRemoteConfig(prev => ({ ...prev, lastSyncTime: new Date().toLocaleString() }));
    setSyncing(false);
    message.success('同步完成，获取到 1 条新订单');
  };

  const handleSaveRemoteConfig = async () => {
    try {
      const values = await remoteForm.validateFields();
      setRemoteConfig(prev => ({ ...prev, ...values }));
      setRemoteConfigVisible(false);
      message.success('远端配置已保存');
    } catch (error) {
      // Form validation failed
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <Space>
          <a onClick={() => handleDetail(record)}>{text}</a>
          {record.source === 'remote' && (
            <Tag color="purple" icon={<CloudSyncOutlined />}>远端</Tag>
          )}
        </Space>
      ),
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
      render: (grade) => <Tag color="blue">{grade}</Tag>,
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
      ellipsis: true,
    },
    {
      title: '需求日期',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record) => (
        <Select
          value={status}
          size="small"
          style={{ width: 100 }}
          onChange={(value) => handleStatusChange(record, value)}
          options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
        />
      ),
      filters: Object.entries(statusConfig).map(([k, v]) => ({ text: v.text, value: k })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleDetail(record)}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout selectedKey="orders">
      <div style={{ padding: 0 }}>
        <Tabs
          items={[
            {
              key: 'orders',
              label: '订单列表',
              children: (
                <Card>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <Space wrap>
                      <Input
                        placeholder="搜索订单号/客户"
                        prefix={<SearchOutlined />}
                        style={{ width: 200 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                      <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} />
                    </Space>
                    <Space>
                      <Badge dot={remoteConfig.enabled} color="green">
                        <Button 
                          icon={<SyncOutlined spin={syncing} />} 
                          onClick={handleSync}
                          loading={syncing}
                          disabled={!remoteConfig.enabled}
                        >
                          同步远端
                        </Button>
                      </Badge>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增订单
                      </Button>
                    </Space>
                  </div>

                  <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    rowKey="id"
                    pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
                  />
                </Card>
              ),
            },
            {
              key: 'remote',
              label: (
                <Space>
                  <ApiOutlined />
                  远端管理
                </Space>
              ),
              children: (
                <Card
                  title={
                    <Space>
                      <CloudSyncOutlined />
                      远端订单同步配置
                    </Space>
                  }
                  extra={
                    <Button type="primary" icon={<SettingOutlined />} onClick={() => {
                      remoteForm.setFieldsValue(remoteConfig);
                      setRemoteConfigVisible(true);
                    }}>
                      编辑配置
                    </Button>
                  }
                >
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="启用状态">
                      <Badge status={remoteConfig.enabled ? 'success' : 'default'} text={remoteConfig.enabled ? '已启用' : '已禁用'} />
                    </Descriptions.Item>
                    <Descriptions.Item label="同步间隔">{remoteConfig.syncInterval} 分钟</Descriptions.Item>
                    <Descriptions.Item label="远端URL" span={2}>
                      <Space>
                        <LinkOutlined />
                        <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                          {remoteConfig.url || '未配置'}
                        </code>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="API Key">
                      <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                        {remoteConfig.apiKey ? `${remoteConfig.apiKey.slice(0, 8)}****` : '未配置'}
                      </code>
                    </Descriptions.Item>
                    <Descriptions.Item label="上次同步">
                      {remoteConfig.lastSyncTime || '从未同步'}
                    </Descriptions.Item>
                  </Descriptions>

                  <div style={{ marginTop: 24 }}>
                    <Card title="同步操作" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>手动同步远端订单</span>
                          <Button 
                            type="primary" 
                            icon={<SyncOutlined spin={syncing} />}
                            onClick={handleSync}
                            loading={syncing}
                            disabled={!remoteConfig.enabled}
                          >
                            立即同步
                          </Button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>测试连接</span>
                          <Button 
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                              message.loading('测试连接中...', 1).then(() => {
                                message.success('连接成功');
                              });
                            }}
                            disabled={!remoteConfig.enabled || !remoteConfig.url}
                          >
                            测试
                          </Button>
                        </div>
                      </Space>
                    </Card>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <Card title="远端订单统计" size="small">
                      <Space size="large">
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-accent)' }}>
                            {orders.filter(o => o.source === 'remote').length}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>远端订单总数</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                            {orders.filter(o => o.source === 'remote' && o.status === 'pending').length}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>待处理</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                            {orders.filter(o => o.source === 'remote' && o.status === 'completed').length}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>已完成</div>
                        </div>
                      </Space>
                    </Card>
                  </div>
                </Card>
              ),
            },
          ]}
        />

        {/* 添加/编辑订单弹窗 */}
        <Modal
          title={selectedOrder ? '编辑订单' : '新增订单'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleSave}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input placeholder="请输入客户名称" />
            </Form.Item>
            <Space style={{ width: '100%' }} size="middle">
              <Form.Item name="concreteGrade" label="混凝土等级" rules={[{ required: true, message: '请选择混凝土等级' }]} style={{ flex: 1 }}>
                <Select placeholder="请选择" options={concreteGrades.map(g => ({ value: g, label: g }))} />
              </Form.Item>
              <Form.Item name="volume" label="方量 (m³)" rules={[{ required: true, message: '请输入方量' }]} style={{ flex: 1 }}>
                <InputNumber min={1} placeholder="请输入方量" style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item name="deliveryAddress" label="配送地址" rules={[{ required: true, message: '请输入配送地址' }]}>
              <Input placeholder="请输入配送地址" />
            </Form.Item>
            <Space style={{ width: '100%' }} size="middle">
              <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]} style={{ flex: 1 }}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item name="requiredDate" label="需求日期" rules={[{ required: true, message: '请选择需求日期' }]} style={{ flex: 1 }}>
                <Input type="date" />
              </Form.Item>
            </Space>
            <Form.Item name="status" label="状态" initialValue="pending">
              <Select options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 订单详情弹窗 */}
        <Modal
          title={`订单详情 - ${selectedOrder?.orderNumber}`}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          width={600}
        >
          {selectedOrder && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="来源">
                <Tag color={selectedOrder.source === 'remote' ? 'purple' : 'blue'}>
                  {selectedOrder.source === 'remote' ? '远端' : '本地'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedOrder.customerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedOrder.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="混凝土等级"><Tag color="blue">{selectedOrder.concreteGrade}</Tag></Descriptions.Item>
              <Descriptions.Item label="方量">{selectedOrder.volume} m³</Descriptions.Item>
              <Descriptions.Item label="配送地址" span={2}>{selectedOrder.deliveryAddress}</Descriptions.Item>
              <Descriptions.Item label="创建日期">{selectedOrder.createdAt}</Descriptions.Item>
              <Descriptions.Item label="需求日期">{selectedOrder.requiredDate}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={statusConfig[selectedOrder.status].color}>
                  {statusConfig[selectedOrder.status].text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 远端配置弹窗 */}
        <Modal
          title="远端同步配置"
          open={remoteConfigVisible}
          onCancel={() => setRemoteConfigVisible(false)}
          onOk={handleSaveRemoteConfig}
          okText="保存"
          cancelText="取消"
          width={500}
        >
          <Form form={remoteForm} layout="vertical">
            <Form.Item name="enabled" label="启用远端同步" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
            <Form.Item name="url" label="远端URL" rules={[{ required: true, message: '请输入远端URL' }]}>
              <Input prefix={<LinkOutlined />} placeholder="https://api.example.com/orders" />
            </Form.Item>
            <Form.Item name="apiKey" label="API Key">
              <Input.Password placeholder="请输入API Key" />
            </Form.Item>
            <Form.Item name="syncInterval" label="同步间隔 (分钟)" rules={[{ required: true, message: '请输入同步间隔' }]}>
              <InputNumber min={1} max={60} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Orders;
