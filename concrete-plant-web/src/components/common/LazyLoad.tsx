/**
 * Lazy Loading Components
 * Provides suspense boundaries and loading states for code-split components
 */

/* eslint-disable react-refresh/only-export-components */

import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingFallbackProps {
  /** Loading message to display */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'default' | 'large';
  /** Full screen loading overlay */
  fullScreen?: boolean;
}

/**
 * Loading fallback component for Suspense boundaries
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = '加载中...',
  size = 'large',
  fullScreen = false,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'default' ? 32 : 24 }} spin />;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <Spin indicator={antIcon} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        {message}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          zIndex: 1000,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        width: '100%',
      }}
    >
      {content}
    </div>
  );
};

/**
 * Page loading fallback with full-height container
 * Uses a subtle skeleton-like loading instead of full screen spinner
 */
export const PageLoadingFallback: React.FC<{ message?: string }> = ({
  message = '加载中...',
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 200,
      padding: 24,
    }}
  >
    <Spin 
      indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      tip={message}
    />
  </div>
);

/**
 * Dashboard loading fallback with industrial styling
 */
export const DashboardLoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      gap: 24,
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--text-accent)',
        animation: 'spin 1s linear infinite',
      }}
    />
    <span
      style={{
        color: 'var(--text-accent)',
        fontSize: 18,
        fontFamily: 'Roboto Mono, monospace',
      }}
    >
      系统初始化中...
    </span>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

interface LazyComponentOptions {
  /** Fallback component to show while loading */
  fallback?: React.ReactNode;
  /** Minimum delay before showing component (prevents flash) */
  minDelay?: number;
}

/**
 * Create a lazy-loaded component with custom fallback
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): React.FC<P> {
  const { fallback = <LoadingFallback />, minDelay = 0 } = options;

  const LazyComponent = lazy(() => {
    if (minDelay > 0) {
      return Promise.all([
        importFn(),
        new Promise(resolve => setTimeout(resolve, minDelay)),
      ]).then(([module]) => module);
    }
    return importFn();
  });

  const WrappedComponent: React.FC<P> = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent;
}

/**
 * Wrapper component for lazy-loaded content
 */
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <LoadingFallback />,
}) => <Suspense fallback={fallback}>{children}</Suspense>;

export default LoadingFallback;
