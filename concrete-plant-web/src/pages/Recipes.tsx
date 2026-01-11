/**
 * Recipes Management Page - 配方管理
 */

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Modal, Descriptions, List } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '../components/layout';

interface RecipeItem {
  material: string;
  targetWeight: number;
  unit: string;
  tolerance: number;
}

interface Recipe {
  id: string;
  name: string;
  concreteGrade: string;
  slump: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  items: RecipeItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'C30标准配方',
    concreteGrade: 'C30',
    slump: '180±20mm',
    version: 'v2.1',
    status: 'active',
    items: [
      { material: '水泥 P.O 42.5', targetWeight: 280, unit: 'kg', tolerance: 2 },
      { material: '骨料 5-10mm', targetWeight: 800, unit: 'kg', tolerance: 3 },
      { material: '骨料 10-20mm', targetWeight: 400, unit: 'kg', tolerance: 3 },
      { material: '矿粉', targetWeight: 80, unit: 'kg', tolerance: 2 },
      { material: '水', targetWeight: 175, unit: 'kg', tolerance: 1 },
      { material: '减水剂', targetWeight: 3.5, unit: 'kg', tolerance: 0.5 },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
    createdBy: '张工',
  },
  {
    id: '2',
    name: 'C40高强配方',
    concreteGrade: 'C40',
    slump: '160±20mm',
    version: 'v1.3',
    status: 'active',
    items: [
      { material: '水泥 P.O 42.5', targetWeight: 350, unit: 'kg', tolerance: 2 },
      { material: '骨料 5-10mm', targetWeight: 750, unit: 'kg', tolerance: 3 },
      { material: '骨料 10-20mm', targetWeight: 450, unit: 'kg', tolerance: 3 },
      { material: '矿粉', targetWeight: 100, unit: 'kg', tolerance: 2 },
      { material: '粉煤灰', targetWeight: 50, unit: 'kg', tolerance: 2 },
      { material: '水', targetWeight: 165, unit: 'kg', tolerance: 1 },
      { material: '减水剂', targetWeight: 4.5, unit: 'kg', tolerance: 0.5 },
    ],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    createdBy: '李工',
  },
  {
    id: '3',
    name: 'C25经济配方',
    concreteGrade: 'C25',
    slump: '180±20mm',
    version: 'v1.0',
    status: 'active',
    items: [
      { material: '水泥 P.O 42.5', targetWeight: 250, unit: 'kg', tolerance: 2 },
      { material: '骨料 5-10mm', targetWeight: 850, unit: 'kg', tolerance: 3 },
      { material: '骨料 10-20mm', targetWeight: 380, unit: 'kg', tolerance: 3 },
      { material: '水', targetWeight: 180, unit: 'kg', tolerance: 1 },
      { material: '减水剂', targetWeight: 3.0, unit: 'kg', tolerance: 0.5 },
    ],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
    createdBy: '王工',
  },
  {
    id: '4',
    name: 'C35抗渗配方',
    concreteGrade: 'C35',
    slump: '160±20mm',
    version: 'v1.1',
    status: 'draft',
    items: [
      { material: '水泥 P.O 42.5', targetWeight: 320, unit: 'kg', tolerance: 2 },
      { material: '骨料 5-10mm', targetWeight: 780, unit: 'kg', tolerance: 3 },
      { material: '骨料 10-20mm', targetWeight: 420, unit: 'kg', tolerance: 3 },
      { material: '矿粉', targetWeight: 90, unit: 'kg', tolerance: 2 },
      { material: '水', targetWeight: 170, unit: 'kg', tolerance: 1 },
      { material: '减水剂', targetWeight: 4.0, unit: 'kg', tolerance: 0.5 },
    ],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-14',
    createdBy: '张工',
  },
];

const statusColors: Record<string, string> = {
  active: 'green',
  draft: 'orange',
  archived: 'default',
};

const statusLabels: Record<string, string> = {
  active: '启用中',
  draft: '草稿',
  archived: '已归档',
};

const Recipes: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const showDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDetailVisible(true);
  };

  const columns: ColumnsType<Recipe> = [
    {
      title: '配方名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '混凝土等级',
      dataIndex: 'concreteGrade',
      key: 'concreteGrade',
      render: (grade) => <Tag color="blue">{grade}</Tag>,
    },
    {
      title: '坍落度',
      dataIndex: 'slump',
      key: 'slump',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version) => <Tag>{version}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '材料数',
      key: 'itemCount',
      render: (_, record) => `${record.items.length} 种`,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />}>
            复制
          </Button>
        </Space>
      ),
    },
  ];

  const filteredData = mockRecipes.filter((item) => {
    return !searchText || 
      item.name.includes(searchText) || 
      item.concreteGrade.includes(searchText);
  });

  return (
    <AppLayout selectedKey="recipes">
      <div style={{ padding: 0 }}>
        <Card
          title="配方管理"
          extra={
            <Space>
              <Input
                placeholder="搜索配方名称或等级"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Button type="primary" icon={<PlusOutlined />}>新建配方</Button>
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

        {/* Recipe Detail Modal */}
        <Modal
          title={selectedRecipe?.name}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={700}
        >
          {selectedRecipe && (
            <>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="混凝土等级">{selectedRecipe.concreteGrade}</Descriptions.Item>
                <Descriptions.Item label="坍落度">{selectedRecipe.slump}</Descriptions.Item>
                <Descriptions.Item label="版本">{selectedRecipe.version}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusColors[selectedRecipe.status]}>{statusLabels[selectedRecipe.status]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建人">{selectedRecipe.createdBy}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedRecipe.updatedAt}</Descriptions.Item>
              </Descriptions>

              <Card title="配方组成" size="small">
                <List
                  dataSource={selectedRecipe.items}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.material}
                        description={`目标: ${item.targetWeight} ${item.unit} | 允差: ±${item.tolerance}%`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Recipes;
