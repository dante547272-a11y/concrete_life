/**
 * Lazy-loaded page components
 * Uses React.lazy for code splitting to improve initial load time
 */

import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';

// Lazy load all page components for code splitting
const LazyLogin = lazy(() => import('./Login'));
const LazyDashboard = lazy(() => import('./Dashboard'));
const LazyVehicles = lazy(() => import('./Vehicles'));
const LazyDrivers = lazy(() => import('./Drivers'));
const LazyOrders = lazy(() => import('./Orders'));
const LazyTasks = lazy(() => import('./Tasks'));
const LazyQueue = lazy(() => import('./Queue'));
const LazyMaterials = lazy(() => import('./Materials'));
const LazyRecipes = lazy(() => import('./Recipes'));
const LazyConcreteGrades = lazy(() => import('./ConcreteGrades'));
const LazyQuality = lazy(() => import('./Quality'));
const LazyBilling = lazy(() => import('./Billing'));
const LazyAlarms = lazy(() => import('./Alarms'));
const LazyLogs = lazy(() => import('./Logs'));
const LazyProductionControl = lazy(() => import('./ProductionControl'));
const LazyEmployees = lazy(() => import('./Employees'));

// Loading fallback with AppLayout skeleton - keeps sidebar/header visible during page load
const LayoutLoadingFallback: React.FC<{ selectedKey: string }> = ({ selectedKey }) => (
  <AppLayout selectedKey={selectedKey}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: 'calc(100vh - 150px)',
    }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
    </div>
  </AppLayout>
);

// Simple loading for login page (no layout)
const SimpleLoading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    background: 'var(--bg-primary)',
  }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
  </div>
);

// Wrapped components with Suspense boundaries
export const LoginPage: React.FC = () => (
  <Suspense fallback={<SimpleLoading />}>
    <LazyLogin />
  </Suspense>
);

export const DashboardPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="dashboard" />}>
    <LazyDashboard />
  </Suspense>
);

export const VehiclesPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="vehicles" />}>
    <LazyVehicles />
  </Suspense>
);

export const DriversPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="drivers" />}>
    <LazyDrivers />
  </Suspense>
);

export const OrdersPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="orders" />}>
    <LazyOrders />
  </Suspense>
);

export const TasksPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="tasks" />}>
    <LazyTasks />
  </Suspense>
);

export const QueuePage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="queue" />}>
    <LazyQueue />
  </Suspense>
);

export const MaterialsPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="materials" />}>
    <LazyMaterials />
  </Suspense>
);

export const RecipesPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="recipes" />}>
    <LazyRecipes />
  </Suspense>
);

export const ConcreteGradesPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="concrete-grades" />}>
    <LazyConcreteGrades />
  </Suspense>
);

export const QualityPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="quality" />}>
    <LazyQuality />
  </Suspense>
);

export const BillingPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="billing" />}>
    <LazyBilling />
  </Suspense>
);

export const AlarmsPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="alarms" />}>
    <LazyAlarms />
  </Suspense>
);

export const LogsPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="logs" />}>
    <LazyLogs />
  </Suspense>
);

export const ProductionControlPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="production-control" />}>
    <LazyProductionControl />
  </Suspense>
);

export const EmployeesPage: React.FC = () => (
  <Suspense fallback={<LayoutLoadingFallback selectedKey="employees" />}>
    <LazyEmployees />
  </Suspense>
);
