import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRuntimeConfig, useFeature, useDeploymentMode, clearConfigCache } from '../useRuntimeConfig'

describe('useRuntimeConfig', () => {
  beforeEach(() => {
    clearConfigCache()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockCloudConfig = {
    mode: 'cloud',
    features: {
      plcCommunication: false,
      realtimeMonitoring: true,
      cloudSync: false,
      multiSiteManagement: true,
      advancedAnalytics: true,
      offlineMode: false,
      dataExport: true,
      reportGeneration: true,
      alarmNotification: true,
      remoteControl: false,
    },
    database: 'postgres',
    plc: { enabled: false },
    cloudSync: { enabled: false },
  }

  const mockEdgeConfig = {
    mode: 'edge',
    features: {
      plcCommunication: true,
      realtimeMonitoring: true,
      cloudSync: true,
      multiSiteManagement: false,
      advancedAnalytics: false,
      offlineMode: true,
      dataExport: true,
      reportGeneration: true,
      alarmNotification: true,
      remoteControl: true,
    },
    database: 'sqlite',
    plc: { enabled: true, host: 'localhost' },
    cloudSync: { enabled: true, apiUrl: 'https://api.example.com' },
  }

  describe('useRuntimeConfig', () => {
    it('应该加载云端配置', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result } = renderHook(() => useRuntimeConfig())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toEqual(mockCloudConfig)
      expect(result.current.deploymentMode).toBe('cloud')
    })

    it('应该加载边缘配置', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEdgeConfig,
      })

      const { result } = renderHook(() => useRuntimeConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toEqual(mockEdgeConfig)
      expect(result.current.deploymentMode).toBe('edge')
    })

    it('应该在 API 失败时使用默认配置', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useRuntimeConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toBeDefined()
      expect(result.current.config?.mode).toBe('hybrid')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useRuntimeConfig] API 不可用，使用默认配置'
      )
    })

    it('应该缓存配置避免重复加载', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result: result1 } = renderHook(() => useRuntimeConfig())
      await waitFor(() => expect(result1.current.loading).toBe(false))

      const { result: result2 } = renderHook(() => useRuntimeConfig())
      
      // 第二次应该立即有配置，不需要等待
      expect(result2.current.loading).toBe(false)
      expect(result2.current.config).toEqual(mockCloudConfig)
      
      // fetch 应该只被调用一次
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('应该在开发模式下支持 localStorage 覆盖', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      localStorage.setItem('dev_config_mode', 'cloud')

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockEdgeConfig, mode: 'hybrid' }),
      })

      const { result } = renderHook(() => useRuntimeConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config?.mode).toBe('cloud')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useRuntimeConfig] 使用开发配置: cloud'
      )
    })

    it('应该处理 API 响应错误', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useRuntimeConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config?.mode).toBe('hybrid')
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('应该监听 storage 事件并重新加载配置', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result } = renderHook(() => useRuntimeConfig())
      await waitFor(() => expect(result.current.loading).toBe(false))

      // 清除 fetch mock 调用记录
      ;(global.fetch as any).mockClear()

      // 模拟 localStorage 变化
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEdgeConfig,
      })

      const storageEvent = new StorageEvent('storage', {
        key: 'dev_config_mode',
        newValue: 'edge',
      })
      window.dispatchEvent(storageEvent)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('useFeature', () => {
    it('应该检查功能是否启用', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result } = renderHook(() => useFeature('multiSiteManagement'))

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('应该检查功能是否禁用', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result } = renderHook(() => useFeature('plcCommunication'))

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })

    it('应该在加载时返回 false', () => {
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useFeature('multiSiteManagement'))

      expect(result.current).toBe(false)
    })
  })

  describe('useDeploymentMode', () => {
    it('应该返回云端模式信息', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result } = renderHook(() => useDeploymentMode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.mode).toBe('cloud')
      expect(result.current.isCloud).toBe(true)
      expect(result.current.isEdge).toBe(false)
      expect(result.current.isHybrid).toBe(false)
    })

    it('应该返回边缘模式信息', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEdgeConfig,
      })

      const { result } = renderHook(() => useDeploymentMode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.mode).toBe('edge')
      expect(result.current.isCloud).toBe(false)
      expect(result.current.isEdge).toBe(true)
      expect(result.current.isHybrid).toBe(false)
    })

    it('应该在加载时返回默认值', () => {
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useDeploymentMode())

      expect(result.current.mode).toBe('hybrid')
      expect(result.current.loading).toBe(true)
    })
  })

  describe('clearConfigCache', () => {
    it('应该清除配置缓存', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCloudConfig,
      })

      const { result: result1 } = renderHook(() => useRuntimeConfig())
      await waitFor(() => expect(result1.current.loading).toBe(false))

      clearConfigCache()

      const { result: result2 } = renderHook(() => useRuntimeConfig())
      
      // 清除缓存后应该重新加载
      expect(result2.current.loading).toBe(true)
    })
  })
})


