/**
 * Sites Management Page - 站点管理
 * 管理多个混凝土搅拌站
 */

import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, Descriptions, Row, Col, Statistic, message } from 'antd';
import { 
  BankOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';
import { useSiteStore } from '../stores/siteStore';
import type { Site } from '../stores/siteStore';

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  active: { color: 'green', text: '运营中', icon: <CheckCircleOutlined /> },
  maintenance: { color: 'orange', text: '维护中', icon: <PauseCircleOutlined /> },
  inactive: { color: 'default', text: '已停用', icon: <StopOutlined /> },
};

const Sites: React.FC = () => {
  const { sites, currentSiteId, setCurrentSite, addSite, updateSite, deleteSite } = useSiteStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setSelectedSite(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Site) => {
    setSelectedSite(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDetail = (record: Site) => {
    setSelectedSite(record);
    setDetailVisible(true);
  };

  const handleDelete = (record: Site) => {
    if (record.id === currentSiteId) {
      message.error('不能删除当前选中的站点');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除站点 "${record.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteSite(record.id);
        message.success('站点已删除');
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (selectedSite) {
        updateSite(selectedSite.id, values);
        message.success('站点已更新');
      } else {
        const newSite: Site = {
          ...values,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        addSite(newSite);
        message.success('站点已添加');
      }
      setModalVisible(false);
    } catch (error) {
      // Form validation failed
    }
  };

  const handleSetCurrent = (record: Site) => {
    setCurrentSite(record.id);
    message.success(`已切换到 ${record.name}`);
  };

  const columns: ColumnsType<Site> = [
    {
      title: '站点名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <BankOutlined style={{ color: record.id === currentSiteId ? '#1890ff' : '#999' }} />
          <a onClick={() => handleDetail(record)}>
            {name}
            {record.id === currentSiteId && <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>}
          </a>
        </Space>
      ),
    },
    {
      title: '站点编码',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag>{code}</Tag>,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: Object.entries(statusConfig).map(([k, v]) => ({ text: v.text, value: k })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.id !== currentSiteId && record.status === 'active' && (
            <Button type="link" size="small" onClick={() => handleSetCurrent(record)}>
              切换
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            disabled={record.id === currentSiteId}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: sites.length,
    active: sites.filter(s => s.status === 'active').length,
    maintenance: sites.filter(s => s.status === 'maintenance').length,
    inactive: sites.filter(s => s.status === 'inactive').length,
  };

  return (
    <AppLayout selectedKey="sites">
      <div style={{ padding: 0 }}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="站点总数" value={stats.total} prefix={<BankOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="运营中" value={stats.active} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="维护中" value={stats.maintenance} valueStyle={{ color: '#faad14' }} prefix={<PauseCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已停用" value={stats.inactive} valueStyle={{ color: '#999' }} prefix={<StopOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* 站点列表 */}
        <Card
          title={
            <Space>
              <BankOutlined />
              站点管理
            </Space>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加站点
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={sites}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* 添加/编辑弹窗 */}
        <Modal
          title={selectedSite ? '编辑站点' : '添加站点'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleSave}
          okText="保存"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
              <Input prefix={<BankOutlined />} placeholder="请输入站点名称" />
            </Form.Item>
            <Form.Item name="code" label="站点编码" rules={[{ required: true, message: '请输入站点编码' }]}>
              <Input placeholder="请输入站点编码，如 HZ001" />
            </Form.Item>
            <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
              <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                placeholder="请选择状态"
                options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
              />
            </Form.Item>
            <Form.Item name="manager" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入负责人姓名" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 详情弹窗 */}
        <Modal
          title={
            <Space>
              <BankOutlined style={{ color: '#1890ff' }} />
              {selectedSite?.name}
            </Space>
          }
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          width={550}
        >
          {selectedSite && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="站点名称">{selectedSite.name}</Descriptions.Item>
              <Descriptions.Item label="站点编码"><Tag>{selectedSite.code}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedSite.status].color} icon={statusConfig[selectedSite.status].icon}>
                  {statusConfig[selectedSite.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建日期">{selectedSite.createdAt}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{selectedSite.address}</Descriptions.Item>
              <Descriptions.Item label="负责人">{selectedSite.manager}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedSite.phone}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Sites;
