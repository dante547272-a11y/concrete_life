/**
 * Concrete Grades Management Page - 混凝土等级管理
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Row, Col, Statistic, message, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { AppLayout } from '../components/layout';
import { exportData } from '../utils/export';

interface ConcreteGrade {
  id: string;
  grade: string;
  strengthClass: string;
  description: string;
  slumpRange: string;
  applications: string[];
  pricePerCubic: number;
  activeRecipes: number;
  status: 'active' | 'inactive';
}

const mockGrades: ConcreteGrade[] = [
  { id: '1', grade: 'C15', strengthClass: '15MPa', description: '低强度混凝土', slumpRange: '160-200mm', applications: ['垫层', '基础'], pricePerCubic: 280, activeRecipes: 1, status: 'active' },
  { id: '2', grade: 'C20', strengthClass: '20MPa', description: '普通混凝土', slumpRange: '160-200mm', applications: ['地面', '道路'], pricePerCubic: 320, activeRecipes: 2, status: 'active' },
  { id: '3', grade: 'C25', strengthClass: '25MPa', description: '普通结构混凝土', slumpRange: '160-200mm', applications: ['梁', '柱', '楼板'], pricePerCubic: 360, activeRecipes: 2, status: 'active' },
  { id: '4', grade: 'C30', strengthClass: '30MPa', description: '中强度混凝土', slumpRange: '160-200mm', applications: ['框架结构', '桥梁'], pricePerCubic: 400, activeRecipes: 3, status: 'active' },
  { id: '5', grade: 'C35', strengthClass: '35MPa', description: '中高强度混凝土', slumpRange: '140-180mm', applications: ['高层建筑', '预应力构件'], pricePerCubic: 450, activeRecipes: 2, status: 'active' },
  { id: '6', grade: 'C40', strengthClass: '40MPa', description: '高强度混凝土', slumpRange: '140-180mm', applications: ['高层核心筒', '大跨度结构'], pricePerCubic: 520, activeRecipes: 2, status: 'active' },
  { id: '7', grade: 'C45', strengthClass: '45MPa', description: '高强度混凝土', slumpRange: '120-160mm', applications: ['超高层', '特殊结构'], pricePerCubic: 600, activeRecipes: 1, status: 'active' },
  { id: '8', grade: 'C50', strengthClass: '50MPa', description: '超高强度混凝土', slumpRange: '120-160mm', applications: ['超高层核心', '桥梁主塔'], pricePerCubic: 700, activeRecipes: 1, status: 'inactive' },
];

const Grades: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  // 导出功能
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    try {
      const exportHeaders = {
        grade: '等级',
        strengthClass: '强度等级',
        description: '描述',
        slumpRange: '坍落度范围',
        applications: '应用场景',
        pricePerCubic: '单价(元/m³)',
        activeRecipes: '活跃配方数',
        status: '状态'
      };

      const exportDataList = filteredData.map(grade => ({
        ...grade,
        applications: grade.applications.join(', '),
        status: grade.status === 'active' ? '启用' : '禁用'
      }));

      exportData(exportDataList, '混凝土等级', format, exportHeaders);
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

  const columns: ColumnsType<ConcreteGrade> = [
    {
      title: '等级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
          {grade}
        </Tag>
      ),
    },
    {
      title: '强度等级',
      dataIndex: 'strengthClass',
      key: 'strengthClass',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '坍落度范围',
      dataIndex: 'slumpRange',
      key: 'slumpRange',
    },
    {
      title: '适用场景',
      dataIndex: 'applications',
      key: 'applications',
      render: (apps: string[]) => (
        <Space wrap>
          {apps.map((app, index) => (
            <Tag key={index}>{app}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '单价 (元/m³)',
      dataIndex: 'pricePerCubic',
      key: 'pricePerCubic',
      render: (price) => (
        <span style={{ fontFamily: 'Roboto Mono, monospace', color: 'var(--text-accent)' }}>
          ¥{price}
        </span>
      ),
    },
    {
      title: '配方数',
      dataIndex: 'activeRecipes',
      key: 'activeRecipes',
      render: (count) => `${count} 个`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>编辑</a>
          <a>配方</a>
        </Space>
      ),
    },
  ];

  const filteredData = mockGrades.filter((item) => {
    return !searchText || 
      item.grade.includes(searchText) || 
      item.description.includes(searchText);
  });

  const activeCount = mockGrades.filter(g => g.status === 'active').length;
  const totalRecipes = mockGrades.reduce((sum, g) => sum + g.activeRecipes, 0);

  return (
    <AppLayout selectedKey="concrete-grades">
      <div style={{ padding: 0 }}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="混凝土等级" value={mockGrades.length} suffix="种" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="启用等级" value={activeCount} suffix="种" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="配方总数" value={totalRecipes} suffix="个" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="平均单价" value={Math.round(mockGrades.reduce((s, g) => s + g.pricePerCubic, 0) / mockGrades.length)} prefix="¥" suffix="/m³" />
            </Card>
          </Col>
        </Row>

        <Card
          title="混凝土等级管理"
          extra={
            <Space>
              <Input
                placeholder="搜索等级"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />}>
                  导出数据
                </Button>
              </Dropdown>
              <Button type="primary" icon={<PlusOutlined />}>新增等级</Button>
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

export default Grades;
