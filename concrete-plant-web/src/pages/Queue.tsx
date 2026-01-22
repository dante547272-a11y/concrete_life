/**
 * Vehicle Queue Board Page
 */

import React from 'react';
import { Card, Tag, Space, Badge } from 'antd';
import { CarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';
import { VirtualList } from '../components/common';

interface QueueItem {
  id: string;
  position: number;
  vehiclePlate: string;
  driverName: string;
  taskNumber: string;
  concreteGrade: string;
  volume: number;
  entryTime: string;
  waitTime: number; // minutes
  status: 'waiting' | 'loading' | 'ready';
}

const mockQueue: QueueItem[] = [
  { id: '1', position: 1, vehiclePlate: '粤A12345', driverName: '张三', taskNumber: 'T20240115001', concreteGrade: 'C30', volume: 8, entryTime: '10:15', waitTime: 0, status: 'loading' },
  { id: '2', position: 2, vehiclePlate: '粤A23456', driverName: '李四', taskNumber: 'T20240115002', concreteGrade: 'C30', volume: 8, entryTime: '10:20', waitTime: 5, status: 'waiting' },
  { id: '3', position: 3, vehiclePlate: '粤A34567', driverName: '王五', taskNumber: 'T20240115003', concreteGrade: 'C40', volume: 10, entryTime: '10:25', waitTime: 10, status: 'waiting' },
  { id: '4', position: 4, vehiclePlate: '粤A45678', driverName: '赵六', taskNumber: 'T20240115004', concreteGrade: 'C30', volume: 8, entryTime: '10:30', waitTime: 15, status: 'waiting' },
  { id: '5', position: 5, vehiclePlate: '粤A56789', driverName: '钱七', taskNumber: 'T20240115005', concreteGrade: 'C25', volume: 6, entryTime: '10:35', waitTime: 20, status: 'waiting' },
];

const statusColors = {
  waiting: 'default',
  loading: 'processing',
  ready: 'green',
};

const statusLabels = {
  waiting: '等待中',
  loading: '装车中',
  ready: '待出发',
};

const QueueCard: React.FC<{ item: QueueItem }> = ({ item }) => {
  const isLoading = item.status === 'loading';

  return (
    <Card
      size="small"
      style={{
        background: isLoading ? 'rgba(0, 255, 136, 0.1)' : 'var(--bg-secondary)',
        border: isLoading ? '2px solid var(--status-running)' : '1px solid var(--border-color)',
        marginBottom: 12,
      }}
      className={isLoading ? 'pulse-border' : ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Badge
              count={item.position}
              style={{
                backgroundColor: isLoading ? 'var(--status-running)' : 'var(--text-accent)',
              }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'Roboto Mono, monospace',
              }}
            >
              {item.vehiclePlate}
            </span>
            <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag>
          </Space>

          <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
            <span>
              <UserOutlined style={{ marginRight: 4 }} />
              {item.driverName}
            </span>
            <span>
              <CarOutlined style={{ marginRight: 4 }} />
              {item.taskNumber}
            </span>
            <span>
              {item.concreteGrade} / {item.volume}m³
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            进场: {item.entryTime}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: item.waitTime > 15 ? 'var(--status-warning)' : 'var(--text-secondary)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            <ClockCircleOutlined />
            等待 {item.waitTime} 分钟
          </div>
        </div>
      </div>
    </Card>
  );
};

const Queue: React.FC = () => {
  return (
    <AppLayout selectedKey="queue">
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
            车辆排队看板
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            当前排队车辆: {mockQueue.length} 辆
          </p>
        </div>

        {/* Using VirtualList for efficient rendering of long queues */}
        <VirtualList
          items={mockQueue}
          itemHeight={100}
          containerHeight={600}
          overscan={2}
          renderItem={(item) => <QueueCard item={item} />}
          keyExtractor={(item) => item.id}
          autoScrollToBottom={false}
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 8,
            padding: 16,
          }}
        />

        <style>{`
          .pulse-border {
            animation: pulse-border 2s infinite;
          }
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(0, 255, 136, 0); }
          }
        `}</style>
      </div>
    </AppLayout>
  );
};

export default Queue;
