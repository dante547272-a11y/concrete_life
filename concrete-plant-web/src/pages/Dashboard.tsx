/**
 * Dashboard Page - Production Control Panel
 * Main visualization screen for the batching plant
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';

// Mock data for dashboard
const currentTask = {
  taskNumber: 'T20240115001',
  concreteGrade: 'C30',
  volume: 8,
  plateNumber: '粤A12345',
  status: '搅拌中',
  progress: 65,
};

const equipmentStatus = [
  { name: '骨料仓1 (5-10mm)', level: 65, status: 'normal' },
  { name: '骨料仓2 (10-20mm)', level: 85, status: 'normal' },
  { name: '骨料仓3 (20-31.5mm)', level: 18, status: 'warning' },
  { name: '水泥仓 (P.O 42.5)', level: 78, status: 'normal' },
  { name: '矿粉仓', level: 25, status: 'warning' },
  { name: '减水剂罐', level: 45, status: 'normal' },
];

const recipeData = [
  { material: '水泥 P.O 42.5', target: 280, actual: 282, unit: 'kg' },
  { material: '骨料 5-10mm', target: 800, actual: 805, unit: 'kg' },
  { material: '骨料 10-20mm', target: 400, actual: 398, unit: 'kg' },
  { material: '矿粉', target: 80, actual: 81, unit: 'kg' },
  { material: '水', target: 175, actual: 174, unit: 'kg' },
  { material: '减水剂', target: 3.5, actual: 3.4, unit: 'kg' },
];

const recentProduction = [
  { batch: 'B001', time: '10:15', grade: 'C30', volume: 8, plate: '粤A12345', status: '已完成' },
  { batch: 'B002', time: '10:32', grade: 'C30', volume: 8, plate: '粤A23456', status: '已完成' },
  { batch: 'B003', time: '10:48', grade: 'C40', volume: 6, plate: '粤A34567', status: '配送中' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Clickable stat card style
  const statCardStyle = {
    background: 'var(--bg-secondary)', 
    padding: 16, 
    borderRadius: 8, 
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <AppLayout selectedKey="dashboard">
      <div style={{ padding: 16 }}>
        {/* Current Task Info */}
        <div 
          style={{ 
            background: 'var(--bg-secondary)', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => navigate('/tasks')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>当前任务: </span>
              <span style={{ color: 'var(--text-accent)', fontWeight: 600, fontSize: 18 }}>
                {currentTask.taskNumber}
              </span>
            </div>
            <div style={{ 
              background: '#1890ff', 
              color: 'white', 
              padding: '2px 12px', 
              borderRadius: 4,
              fontSize: 14 
            }}>
              {currentTask.concreteGrade}
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>方量: </span>
              <span style={{ color: 'var(--text-primary)' }}>{currentTask.volume}m³</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>车牌: </span>
              <span style={{ color: 'var(--text-primary)' }}>{currentTask.plateNumber}</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{currentTask.status} </span>
              <span style={{ color: 'var(--status-running)' }}>{currentTask.progress}%</span>
            </div>
          </div>
        </div>

        {/* Statistics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          <div 
            style={statCardStyle}
            onClick={() => navigate('/tasks')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>今日产量</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600 }}>156 <span style={{ fontSize: 14 }}>m³</span></div>
          </div>
          <div 
            style={statCardStyle}
            onClick={() => navigate('/tasks')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>完成批次</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 600 }}>18 <span style={{ fontSize: 14 }}>批</span></div>
          </div>
          <div 
            style={statCardStyle}
            onClick={() => navigate('/queue')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#faad14'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>排队车辆</div>
            <div style={{ color: 'var(--status-warning)', fontSize: 28, fontWeight: 600 }}>5 <span style={{ fontSize: 14 }}>辆</span></div>
          </div>
          <div 
            style={statCardStyle}
            onClick={() => navigate('/alarms')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff4d4f'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>活跃告警</div>
            <div style={{ color: 'var(--status-stopped)', fontSize: 28, fontWeight: 600 }}>2 <span style={{ fontSize: 14 }}>条</span></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Equipment Status */}
          <div 
            style={{ ...statCardStyle }}
            onClick={() => navigate('/production-control')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 16 }}>设备状态</h3>
            {equipmentStatus.map((eq, index) => (
              <div key={index} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{eq.name}</span>
                  <span style={{ 
                    color: eq.status === 'warning' ? 'var(--status-warning)' : 'var(--text-primary)',
                    fontFamily: 'monospace',
                  }}>
                    {eq.level}%
                  </span>
                </div>
                <div style={{ 
                  height: 6, 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${eq.level}%`, 
                    height: '100%', 
                    background: eq.status === 'warning' ? 'var(--status-warning)' : 'var(--status-running)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recipe Table */}
          <div 
            style={{ ...statCardStyle }}
            onClick={() => navigate('/recipes')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 16 }}>当前配方</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>材料</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>目标</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>实际</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>偏差</th>
                </tr>
              </thead>
              <tbody>
                {recipeData.map((item, index) => {
                  const dev = ((item.actual - item.target) / item.target * 100).toFixed(1);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 4px', color: 'var(--text-primary)', fontSize: 13 }}>{item.material}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'monospace' }}>{item.target}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace' }}>{item.actual}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '8px 4px', 
                        fontSize: 13, 
                        fontFamily: 'monospace',
                        color: Math.abs(parseFloat(dev)) > 2 ? 'var(--status-warning)' : 'var(--status-running)'
                      }}>
                        {parseFloat(dev) > 0 ? '+' : ''}{dev}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent Production */}
          <div 
            style={{ ...statCardStyle }}
            onClick={() => navigate('/tasks')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 16 }}>生产记录</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>批次</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>时间</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>等级</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>方量</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 12 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentProduction.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 4px', color: 'var(--text-primary)', fontSize: 13 }}>{item.batch}</td>
                    <td style={{ padding: '8px 4px', color: 'var(--text-secondary)', fontSize: 13 }}>{item.time}</td>
                    <td style={{ padding: '8px 4px' }}>
                      <span style={{ background: '#1890ff', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        {item.grade}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-primary)', fontSize: 13 }}>{item.volume}m³</td>
                    <td style={{ padding: '8px 4px' }}>
                      <span style={{ 
                        background: item.status === '已完成' ? '#52c41a' : '#1890ff', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 12 
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
