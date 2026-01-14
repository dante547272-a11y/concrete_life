import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Badge, Select } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  FileTextOutlined,
  SendOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DatabaseOutlined,
  AuditOutlined,
  AlertOutlined,
  HistoryOutlined,
  TeamOutlined,
  ExperimentOutlined,
  AccountBookOutlined,
  ControlOutlined,
  SunOutlined,
  MoonOutlined,
  ToolOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useResponsive, useFullscreen } from '../../hooks/useResponsive';
import { useThemeStore } from '../../stores/themeStore';
import { useSiteStore } from '../../stores/siteStore';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  selectedKey?: string;
  openKeys?: string[];
  onMenuSelect?: (key: string) => void;
  onOpenChange?: (keys: string[]) => void;
}

const menuItems: MenuProps['items'] = [
  {
    key: 'sites',
    icon: <BankOutlined />,
    label: '站点管理',
  },
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '生产概览',
  },
  {
    key: 'production-control',
    icon: <ControlOutlined />,
    label: '生产中控',
  },
  {
    key: 'vehicle-management',
    icon: <CarOutlined />,
    label: '车辆管理',
    children: [
      {
        key: 'vehicles',
        icon: <CarOutlined />,
        label: '车辆档案',
      },
      {
        key: 'drivers',
        icon: <TeamOutlined />,
        label: '司机管理',
      },
      {
        key: 'queue',
        icon: <UnorderedListOutlined />,
        label: '排队看板',
      },
    ],
  },
  {
    key: 'material-management',
    icon: <DatabaseOutlined />,
    label: '混凝土/物料管理',
    children: [
      {
        key: 'materials',
        icon: <DatabaseOutlined />,
        label: '原材料库存',
      },
      {
        key: 'recipes',
        icon: <ExperimentOutlined />,
        label: '配方管理',
      },
      {
        key: 'concrete-grades',
        icon: <AuditOutlined />,
        label: '混凝土等级',
      },
      {
        key: 'strategies',
        icon: <SettingOutlined />,
        label: '策略管理',
      },
      {
        key: 'equipment',
        icon: <ToolOutlined />,
        label: '设备管理',
      },
    ],
  },
  {
    key: 'order-management',
    icon: <FileTextOutlined />,
    label: '任务/订单管理',
    children: [
      {
        key: 'orders',
        icon: <FileTextOutlined />,
        label: '订单管理',
      },
      {
        key: 'tasks',
        icon: <SendOutlined />,
        label: '任务派单',
      },
    ],
  },
  {
    key: 'quality-billing',
    icon: <AuditOutlined />,
    label: '质量追溯与计费',
    children: [
      {
        key: 'quality',
        icon: <ExperimentOutlined />,
        label: '质量追溯',
      },
      {
        key: 'billing',
        icon: <AccountBookOutlined />,
        label: '计费对账',
      },
    ],
  },
  {
    key: 'logs-alarms',
    icon: <AlertOutlined />,
    label: '日志及告警',
    children: [
      {
        key: 'alarms',
        icon: <AlertOutlined />,
        label: '告警中心',
      },
      {
        key: 'logs',
        icon: <HistoryOutlined />,
        label: '操作日志',
      },
    ],
  },
  {
    key: 'employees',
    icon: <TeamOutlined />,
    label: '员工管理',
  },
];

const userMenuItems: MenuProps['items'] = [
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '设置',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '退出登录',
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  selectedKey: propSelectedKey,
  openKeys: controlledOpenKeys,
  onMenuSelect,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isHD, isTablet, isMobile } = useResponsive();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { mode: themeMode, toggleTheme } = useThemeStore();
  const { currentSiteId, sites, setCurrentSite } = useSiteStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    // Update CSS variables based on theme
    const root = document.documentElement;
    if (themeMode === 'light') {
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#e8e8e8');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--text-accent', '#1890ff');
      root.style.setProperty('--border-color', '#d9d9d9');
    } else {
      root.style.setProperty('--bg-primary', '#0a0e14');
      root.style.setProperty('--bg-secondary', '#141a24');
      root.style.setProperty('--bg-tertiary', '#1e2632');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#8892a0');
      root.style.setProperty('--text-accent', '#00d4ff');
      root.style.setProperty('--border-color', '#2d3a4a');
    }
  }, [themeMode]);

  // Determine selected key from URL if not provided
  const pathKey = location.pathname.replace('/', '') || 'dashboard';
  const selectedKey = propSelectedKey ?? pathKey;

  // Map child keys to parent keys for auto-expanding
  const childToParentMap: Record<string, string> = {
    'vehicles': 'vehicle-management',
    'drivers': 'vehicle-management',
    'queue': 'vehicle-management',
    'materials': 'material-management',
    'recipes': 'material-management',
    'concrete-grades': 'material-management',
    'strategies': 'material-management',
    'equipment': 'material-management',
    'orders': 'order-management',
    'tasks': 'order-management',
    'quality': 'quality-billing',
    'billing': 'quality-billing',
    'alarms': 'logs-alarms',
    'logs': 'logs-alarms',
  };

  // Calculate default open keys based on current route
  const getDefaultOpenKeys = (): string[] => {
    const parentKey = childToParentMap[pathKey];
    return parentKey ? [parentKey] : [];
  };

  const [internalOpenKeys, setInternalOpenKeys] = useState<string[]>(getDefaultOpenKeys);

  // Update open keys when route changes
  React.useEffect(() => {
    const parentKey = childToParentMap[pathKey];
    if (parentKey && !internalOpenKeys.includes(parentKey)) {
      setInternalOpenKeys(prev => [...prev, parentKey]);
    }
  }, [pathKey]);

  // Use controlled or internal open keys
  const openKeys = controlledOpenKeys ?? internalOpenKeys;
  const handleOpenChange = (keys: string[]) => {
    if (onOpenChange) {
      onOpenChange(keys);
    } else {
      setInternalOpenKeys(keys);
    }
  };

  // Handle menu click - navigate to the route
  const handleMenuClick = (key: string) => {
    if (onMenuSelect) {
      onMenuSelect(key);
    }
    // Navigate to the route
    navigate(`/${key}`);
  };

  // Auto-collapse sidebar on smaller screens
  const effectiveCollapsed = isMobile || isTablet ? true : collapsed;

  // Calculate sidebar width based on screen size and collapse state
  const sidebarWidth = isHD ? 280 : 240;
  const collapsedWidth = isHD ? 80 : 64;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sider
        collapsible
        collapsed={effectiveCollapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={sidebarWidth}
        collapsedWidth={collapsedWidth}
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: isHD ? 64 : 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--border-color)',
            padding: effectiveCollapsed ? '0 8px' : '0 16px',
          }}
        >
          {effectiveCollapsed ? (
            <span style={{ fontSize: isHD ? 24 : 20, color: 'var(--text-accent)' }}>🏭</span>
          ) : (
            <span
              style={{
                fontSize: isHD ? 16 : 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              混凝土管控平台
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme={themeMode}
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={effectiveCollapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            fontSize: isHD ? 14 : 13,
          }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: `0 ${isHD ? 24 : 16}px`,
            height: isHD ? 64 : 56,
            lineHeight: isHD ? '64px' : '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side - collapse button and site switcher */}
          <Space size="middle">
            {!isMobile && !isTablet && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: isHD ? 18 : 16,
                  color: 'var(--text-secondary)',
                }}
              />
            )}
            
            {/* Site Switcher */}
            <Select
              value={currentSiteId}
              onChange={setCurrentSite}
              style={{ width: 160 }}
              size="middle"
              suffixIcon={<BankOutlined style={{ color: 'var(--text-secondary)' }} />}
              options={sites
                .filter(s => s.status === 'active')
                .map(s => ({ 
                  value: s.id, 
                  label: s.name,
                }))}
            />
          </Space>

          {/* Right side - actions */}
          <Space size={isHD ? 'middle' : 'small'}>
            {/* Theme toggle */}
            <Button
              type="text"
              icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ 
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
              }}
              title={themeMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            />

            {/* Fullscreen toggle */}
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{ color: 'var(--text-secondary)' }}
              title={isFullscreen ? '退出全屏' : '全屏显示'}
            />

            {/* Notifications */}
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: 'var(--text-secondary)' }}
              />
            </Badge>

            {/* User menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={isHD ? 36 : 32}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: 'var(--text-accent)' }}
                />
                {!effectiveCollapsed && (
                  <span style={{ color: 'var(--text-primary)', fontSize: isHD ? 14 : 13 }}>
                    操作员
                  </span>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            background: 'var(--bg-primary)',
            padding: isHD ? 24 : 16,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
