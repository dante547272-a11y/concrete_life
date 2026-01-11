/**
 * Employees Management Page - 员工管理
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Modal, Form, Select, Avatar, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface Employee {
  id: string;
  name: string;
  employeeNo: string;
  department: string;
  position: string;
  phone: string;
  status: 'active' | 'inactive' | 'leave';
  joinDate: string;
  avatar?: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: '张三', employeeNo: 'EMP001', department: '生产部', position: '操作员', phone: '138****1234', status: 'active', joinDate: '2022-03-15' },
  { id: '2', name: '李四', employeeNo: 'EMP002', department: '生产部', position: '班组长', phone: '139****2345', status: 'active', joinDate: '2021-06-20' },
  { id: '3', name: '王五', employeeNo: 'EMP003', department: '质检部', position: '质检员', phone: '137****3456', status: 'active', joinDate: '2023-01-10' },
  { id: '4', name: '赵六', employeeNo: 'EMP004', department: '调度部', position: '调度员', phone: '136****4567', status: 'active', joinDate: '2022-08-05' },
  { id: '5', name: '钱七', employeeNo: 'EMP005', department: '生产部', position: '操作员', phone: '135****5678', status: 'leave', joinDate: '2023-04-18' },
  { id: '6', name: '孙八', employeeNo: 'EMP006', department: '维修部', position: '维修工', phone: '134****6789', status: 'active', joinDate: '2022-11-22' },
  { id: '7', name: '周九', employeeNo: 'EMP007', department: '财务部', position: '会计', phone: '133****7890', status: 'active', joinDate: '2021-09-01' },
  { id: '8', name: '吴十', employeeNo: 'EMP008', department: '生产部', position: '操作员', phone: '132****8901', status: 'inactive', joinDate: '2020-05-12' },
];

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  leave: 'orange',
};

const statusLabels: Record<string, string> = {
  active: '在职',
  inactive: '离职',
  leave: '请假',
};

const departments = ['生产部', '质检部', '调度部', '维修部', '财务部', '行政部'];
const positions = ['操作员', '班组长', '质检员', '调度员', '维修工', '会计', '主管', '经理'];

const Employees: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      setModalVisible(false);
      // 这里可以添加保存逻辑
    });
  };

  const columns: ColumnsType<Employee> = [
    {
      title: '员工',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.employeeNo}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: departments.map(d => ({ text: d, value: d })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          {phone}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
      filters: Object.entries(statusLabels).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该员工吗？" okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = mockEmployees.filter((item) => {
    return !searchText || 
      item.name.includes(searchText) || 
      item.employeeNo.includes(searchText) ||
      item.department.includes(searchText);
  });

  return (
    <AppLayout selectedKey="employees">
      <div style={{ padding: 0 }}>
        <Card
          title="员工管理"
          extra={
            <Space>
              <Input
                placeholder="搜索员工姓名/工号/部门"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220 }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增员工</Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 名员工` }}
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={editingEmployee ? '编辑员工' : '新增员工'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleSave}
          okText="保存"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item name="employeeNo" label="工号" rules={[{ required: true, message: '请输入工号' }]}>
              <Input placeholder="请输入工号" disabled={!!editingEmployee} />
            </Form.Item>
            <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
              <Select placeholder="请选择部门" options={departments.map(d => ({ value: d, label: d }))} />
            </Form.Item>
            <Form.Item name="position" label="职位" rules={[{ required: true, message: '请选择职位' }]}>
              <Select placeholder="请选择职位" options={positions.map(p => ({ value: p, label: p }))} />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select placeholder="请选择状态" options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Employees;
