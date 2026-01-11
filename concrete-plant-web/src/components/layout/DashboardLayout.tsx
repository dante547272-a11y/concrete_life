import React from 'react';
import { useResponsive, useFullscreen } from '../../hooks/useResponsive';
import { Button, Space, Badge } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  WifiOutlined,
  DisconnectOutlined,
  BellOutlined,
} from '@ant-design/icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
  taskInfo?: {
    taskNumber: string;
    concreteGrade: string;
    volume: number;
    plateNumber: string;
  };
  connected?: boolean;
  alarmCount?: number;
  onAlarmClick?: () => void;
}

/**
 * Dashboard layout optimized for control panel displays
 * Supports 1920x1080 HD and larger screens
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  taskInfo,
  connected = false,
  alarmCount = 0,
  onAlarmClick,
}) => {
  const { isHD, isUHD, isControlPanel, width, height } = useResponsive();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Calculate responsive styles
  const headerHeight = isUHD ? 72 : isHD ? 64 : 56;
  const fontSize = {
    title: isUHD ? 20 : isHD ? 18 : 14,
    value: isUHD ? 24 : isHD ? 20 : 16,
    label: isUHD ? 14 : isHD ? 12 : 11,
  };
  const padding = isUHD ? 24 : isHD ? 16 : 12;

  return (
    <div
      className={`dashboard-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Task Info Bar - Top Header */}
      <header
        className="task-info-bar"
        style={{
          height: headerHeight,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${padding}px`,
        }}
      >
        {/* Left - Task Info */}
        <Space size={isHD ? 'large' : 'middle'}>
          {taskInfo ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: fontSize.label }}>
                  任务:
                </span>
                <span
                  style={{
                    color: 'var(--text-accent)',
                    fontSize: fontSize.value,
                    fontFamily: 'Roboto Mono, monospace',
                    fontWeight: 600,
                  }}
                >
                  {taskInfo.taskNumber}
                </span>
              </div>
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: `${isHD ? 6 : 4}px ${isHD ? 16 : 12}px`,
                  borderRadius: 4,
                }}
              >
                <span
                  style={{
                    color: 'var(--status-running)',
                    fontSize: fontSize.title,
                    fontWeight: 600,
                  }}
                >
                  {taskInfo.concreteGrade}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: fontSize.label }}>
                  方量:
                </span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: fontSize.value,
                    fontFamily: 'Roboto Mono, monospace',
                  }}
                >
                  {taskInfo.volume}m³
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: fontSize.label }}>
                  车牌:
                </span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: fontSize.value,
                    fontFamily: 'Roboto Mono, monospace',
                  }}
                >
                  {taskInfo.plateNumber}
                </span>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: fontSize.label }}>
              暂无生产任务
            </span>
          )}
        </Space>

        {/* Right - Status & Actions */}
        <Space size={isHD ? 'middle' : 'small'}>
          {/* Connection Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: `${isHD ? 6 : 4}px ${isHD ? 12 : 8}px`,
              background: connected
                ? 'rgba(0, 255, 136, 0.1)'
                : 'rgba(255, 71, 87, 0.1)',
              borderRadius: 4,
              border: `1px solid ${connected ? 'var(--status-running)' : 'var(--status-stopped)'}`,
            }}
          >
            {connected ? (
              <WifiOutlined style={{ color: 'var(--status-running)', fontSize: fontSize.label }} />
            ) : (
              <DisconnectOutlined
                style={{ color: 'var(--status-stopped)', fontSize: fontSize.label }}
              />
            )}
            <span
              style={{
                color: connected ? 'var(--status-running)' : 'var(--status-stopped)',
                fontSize: fontSize.label,
              }}
            >
              {connected ? '连接正常' : '连接断开'}
            </span>
          </div>

          {/* Alarm Indicator */}
          <Badge count={alarmCount} size={isHD ? 'default' : 'small'}>
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={onAlarmClick}
              style={{
                color: alarmCount > 0 ? 'var(--status-warning)' : 'var(--text-secondary)',
                fontSize: fontSize.title,
              }}
              className={alarmCount > 0 ? 'alarm-active' : ''}
            />
          </Badge>

          {/* Fullscreen Toggle */}
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{ color: 'var(--text-secondary)', fontSize: fontSize.title }}
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          />

          {/* Screen Info (debug) */}
          {isControlPanel && (
            <span style={{ color: 'var(--text-secondary)', fontSize: fontSize.label }}>
              {width}×{height}
            </span>
          )}
        </Space>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
