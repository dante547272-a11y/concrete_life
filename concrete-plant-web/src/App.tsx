/**
 * Main Application Component
 * Uses React Router with lazy-loaded pages for optimal performance
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  LoginPage,
  DashboardPage,
  VehiclesPage,
  DriversPage,
  OrdersPage,
  TasksPage,
  QueuePage,
  MaterialsPage,
  RecipesPage,
  ConcreteGradesPage,
  QualityPage,
  BillingPage,
  AlarmsPage,
  LogsPage,
  ProductionControlPage,
  EmployeesPage,
  StrategiesPage,
  EquipmentPage,
  SitesPage,
} from './pages';
import { useThemeStore } from './stores/themeStore';
import './styles/industrial.css';
import './styles/responsive.css';

// Ant Design theme configurations
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#00d4ff',
    colorBgContainer: '#141a24',
    colorBgElevated: '#1e2632',
    colorBorder: '#2d3a4a',
    colorText: '#ffffff',
    colorTextSecondary: '#8892a0',
    borderRadius: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f5f5f5',
    colorBorder: '#d9d9d9',
    colorText: '#1a1a1a',
    colorTextSecondary: '#666666',
    borderRadius: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

function App() {
  const { mode } = useThemeStore();
  const currentTheme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ConfigProvider theme={currentTheme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/production-control" element={<ProductionControlPage />} />
          <Route path="/sites" element={<SitesPage />} />
          
          {/* 车辆管理 */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/queue" element={<QueuePage />} />
          
          {/* 混凝土/物料管理 */}
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/concrete-grades" element={<ConcreteGradesPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          
          {/* 任务/订单管理 */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          
          {/* 质量追溯与计费 */}
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/billing" element={<BillingPage />} />
          
          {/* 日志及告警 */}
          <Route path="/alarms" element={<AlarmsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          
          {/* 员工管理 */}
          <Route path="/employees" element={<EmployeesPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
