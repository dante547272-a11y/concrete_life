import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsive, useBreakpoint, useFullscreen, useComponentSizes, BREAKPOINTS } from '../useResponsive'

describe('useResponsive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    })
  }

  describe('useResponsive', () => {
    it('应该返回移动端状态', () => {
      setWindowSize(375, 667)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('mobile')
      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
    })

    it('应该返回平板状态', () => {
      setWindowSize(768, 1024)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('tablet')
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('应该返回桌面状态', () => {
      setWindowSize(1280, 720)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('desktop')
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(true)
    })

    it('应该返回高清状态', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('hd')
      expect(result.current.isHD).toBe(true)
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isLargeScreen).toBe(true)
    })

    it('应该返回超高清状态', () => {
      setWindowSize(2560, 1440)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('uhd')
      expect(result.current.isUHD).toBe(true)
      expect(result.current.isHD).toBe(true)
      expect(result.current.isDesktop).toBe(true)
    })

    it('应该检测控制面板模式', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.isControlPanel).toBe(true)
    })

    it('应该在窗口大小改变时更新状态', () => {
      setWindowSize(375, 667)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBe('mobile')

      act(() => {
        setWindowSize(1920, 1080)
        window.dispatchEvent(new Event('resize'))
        vi.advanceTimersByTime(100)
      })

      expect(result.current.breakpoint).toBe('hd')
    })

    it('应该防抖处理窗口大小改变', () => {
      setWindowSize(375, 667)
      const { result } = renderHook(() => useResponsive())

      const initialBreakpoint = result.current.breakpoint

      act(() => {
        setWindowSize(768, 1024)
        window.dispatchEvent(new Event('resize'))
        vi.advanceTimersByTime(50)
        
        setWindowSize(1920, 1080)
        window.dispatchEvent(new Event('resize'))
        vi.advanceTimersByTime(50)
      })

      // 应该还是初始值，因为防抖还没触发
      expect(result.current.breakpoint).toBe(initialBreakpoint)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // 现在应该更新为最后的值
      expect(result.current.breakpoint).toBe('hd')
    })

    it('应该返回正确的宽度和高度', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useResponsive())

      expect(result.current.width).toBe(1920)
      expect(result.current.height).toBe(1080)
    })
  })

  describe('useBreakpoint', () => {
    it('应该在达到最小断点时返回 true', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useBreakpoint('desktop'))

      expect(result.current).toBe(true)
    })

    it('应该在未达到最小断点时返回 false', () => {
      setWindowSize(375, 667)
      const { result } = renderHook(() => useBreakpoint('desktop'))

      expect(result.current).toBe(false)
    })

    it('应该在边界值时正确判断', () => {
      setWindowSize(BREAKPOINTS.tablet, 1024)
      const { result } = renderHook(() => useBreakpoint('tablet'))

      expect(result.current).toBe(true)
    })
  })

  describe('useFullscreen', () => {
    let requestFullscreenSpy: any
    let exitFullscreenSpy: any

    beforeEach(() => {
      requestFullscreenSpy = vi.fn().mockResolvedValue(undefined)
      exitFullscreenSpy = vi.fn().mockResolvedValue(undefined)

      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        writable: true,
        value: requestFullscreenSpy,
      })

      Object.defineProperty(document, 'exitFullscreen', {
        writable: true,
        value: exitFullscreenSpy,
      })

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      })
    })

    it('应该初始状态为非全屏', () => {
      const { result } = renderHook(() => useFullscreen())

      expect(result.current.isFullscreen).toBe(false)
    })

    it('应该进入全屏模式', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.enterFullscreen()
      })

      expect(requestFullscreenSpy).toHaveBeenCalled()
    })

    it('应该退出全屏模式', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(exitFullscreenSpy).toHaveBeenCalled()
    })

    it('应该切换全屏模式', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.toggleFullscreen()
      })

      expect(requestFullscreenSpy).toHaveBeenCalled()
    })

    it('应该处理全屏状态变化事件', () => {
      const { result } = renderHook(() => useFullscreen())

      act(() => {
        Object.defineProperty(document, 'fullscreenElement', {
          writable: true,
          value: document.documentElement,
        })
        document.dispatchEvent(new Event('fullscreenchange'))
      })

      expect(result.current.isFullscreen).toBe(true)
    })

    it('应该处理进入全屏失败', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      requestFullscreenSpy.mockRejectedValue(new Error('Fullscreen not allowed'))

      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.enterFullscreen()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to enter fullscreen:', expect.any(Error))
    })

    it('应该处理退出全屏失败', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      exitFullscreenSpy.mockRejectedValue(new Error('Exit fullscreen failed'))

      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to exit fullscreen:', expect.any(Error))
    })
  })

  describe('useComponentSizes', () => {
    it('应该返回移动端组件尺寸', () => {
      setWindowSize(375, 667)
      const { result } = renderHook(() => useComponentSizes())

      expect(result.current.sizes.binWidth).toBe(120)
      expect(result.current.sizes.binHeight).toBe(160)
      expect(result.current.sizes.labelFontSize).toBe(12)
      expect(result.current.breakpoint).toBe('mobile')
    })

    it('应该返回高清组件尺寸', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useComponentSizes())

      expect(result.current.sizes.binWidth).toBe(160)
      expect(result.current.sizes.binHeight).toBe(220)
      expect(result.current.sizes.labelFontSize).toBe(14)
      expect(result.current.breakpoint).toBe('hd')
    })

    it('应该返回超高清组件尺寸', () => {
      setWindowSize(2560, 1440)
      const { result } = renderHook(() => useComponentSizes())

      expect(result.current.sizes.binWidth).toBe(200)
      expect(result.current.sizes.binHeight).toBe(280)
      expect(result.current.sizes.labelFontSize).toBe(16)
      expect(result.current.breakpoint).toBe('uhd')
    })

    it('应该返回所有组件尺寸', () => {
      setWindowSize(1920, 1080)
      const { result } = renderHook(() => useComponentSizes())

      expect(result.current.sizes).toHaveProperty('binWidth')
      expect(result.current.sizes).toHaveProperty('binHeight')
      expect(result.current.sizes).toHaveProperty('siloWidth')
      expect(result.current.sizes).toHaveProperty('siloHeight')
      expect(result.current.sizes).toHaveProperty('mixerWidth')
      expect(result.current.sizes).toHaveProperty('mixerHeight')
      expect(result.current.sizes).toHaveProperty('scaleWidth')
      expect(result.current.sizes).toHaveProperty('scaleHeight')
      expect(result.current.sizes).toHaveProperty('tankWidth')
      expect(result.current.sizes).toHaveProperty('tankHeight')
      expect(result.current.sizes).toHaveProperty('labelFontSize')
      expect(result.current.sizes).toHaveProperty('valueFontSize')
      expect(result.current.sizes).toHaveProperty('titleFontSize')
      expect(result.current.sizes).toHaveProperty('componentGap')
      expect(result.current.sizes).toHaveProperty('sectionGap')
    })
  })
})


