import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    const { setState } = useThemeStore
    setState({ mode: 'dark' })
  })

  describe('初始状态', () => {
    it('应该默认为暗色主题', () => {
      const { result } = renderHook(() => useThemeStore())

      expect(result.current.mode).toBe('dark')
    })
  })

  describe('toggleTheme', () => {
    it('应该从暗色切换到亮色', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.mode).toBe('light')
    })

    it('应该从亮色切换到暗色', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.mode).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.mode).toBe('dark')
    })

    it('应该支持多次切换', () => {
      const { result } = renderHook(() => useThemeStore())

      expect(result.current.mode).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.mode).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.mode).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.mode).toBe('light')
    })
  })

  describe('setTheme', () => {
    it('应该设置为暗色主题', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.mode).toBe('light')

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.mode).toBe('dark')
    })

    it('应该设置为亮色主题', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.mode).toBe('light')
    })

    it('应该允许设置相同的主题', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.mode).toBe('dark')

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.mode).toBe('dark')
    })
  })

  describe('状态持久化', () => {
    it('应该在多个 hook 实例间共享状态', () => {
      const { result: result1 } = renderHook(() => useThemeStore())
      const { result: result2 } = renderHook(() => useThemeStore())

      expect(result1.current.mode).toBe(result2.current.mode)

      act(() => {
        result1.current.toggleTheme()
      })

      expect(result1.current.mode).toBe('light')
      expect(result2.current.mode).toBe('light')
    })

    it('应该在切换主题后保持同步', () => {
      const { result: result1 } = renderHook(() => useThemeStore())
      const { result: result2 } = renderHook(() => useThemeStore())

      act(() => {
        result1.current.setTheme('light')
      })

      expect(result2.current.mode).toBe('light')

      act(() => {
        result2.current.setTheme('dark')
      })

      expect(result1.current.mode).toBe('dark')
    })
  })

  describe('边界情况', () => {
    it('应该处理快速连续切换', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.toggleTheme()
        result.current.toggleTheme()
        result.current.toggleTheme()
        result.current.toggleTheme()
      })

      expect(result.current.mode).toBe('dark')
    })

    it('应该在 toggle 和 set 混合使用时正确工作', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.toggleTheme() // dark -> light
      })
      expect(result.current.mode).toBe('light')

      act(() => {
        result.current.setTheme('dark') // light -> dark
      })
      expect(result.current.mode).toBe('dark')

      act(() => {
        result.current.toggleTheme() // dark -> light
      })
      expect(result.current.mode).toBe('light')

      act(() => {
        result.current.setTheme('light') // light -> light
      })
      expect(result.current.mode).toBe('light')
    })
  })
})


