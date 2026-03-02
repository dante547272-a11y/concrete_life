import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle, debounce, UpdateBatcher, rafThrottle, memoize } from '../performance'

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('throttle', () => {
    it('应该立即执行第一次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1000)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在延迟期间忽略多次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1000)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在延迟后允许再次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1000)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1000)
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('应该在延迟结束时执行最后一次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1000)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('应该正确传递参数', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1000)

      throttled('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('debounce', () => {
    it('应该延迟执行函数', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 1000)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时重置延迟', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 1000)

      debounced()
      vi.advanceTimersByTime(500)
      debounced()
      vi.advanceTimersByTime(500)
      debounced()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该只执行最后一次调用', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 1000)

      debounced('first')
      debounced('second')
      debounced('third')

      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })

    it('应该正确传递参数', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 1000)

      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('UpdateBatcher', () => {
    it('应该批量处理更新', () => {
      const processor = vi.fn()
      const batcher = new UpdateBatcher(processor, 100)

      batcher.add('update1')
      batcher.add('update2')
      batcher.add('update3')

      expect(processor).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith(['update1', 'update2', 'update3'])
    })

    it('应该支持手动刷新', () => {
      const processor = vi.fn()
      const batcher = new UpdateBatcher(processor, 100)

      batcher.add('update1')
      batcher.add('update2')
      batcher.flush()

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith(['update1', 'update2'])
    })

    it('应该支持清空更新', () => {
      const processor = vi.fn()
      const batcher = new UpdateBatcher(processor, 100)

      batcher.add('update1')
      batcher.add('update2')
      batcher.clear()

      vi.advanceTimersByTime(100)
      expect(processor).not.toHaveBeenCalled()
    })

    it('应该在刷新后清空更新列表', () => {
      const processor = vi.fn()
      const batcher = new UpdateBatcher(processor, 100)

      batcher.add('update1')
      batcher.flush()
      batcher.add('update2')
      batcher.flush()

      expect(processor).toHaveBeenCalledTimes(2)
      expect(processor).toHaveBeenNthCalledWith(1, ['update1'])
      expect(processor).toHaveBeenNthCalledWith(2, ['update2'])
    })

    it('应该处理空批次', () => {
      const processor = vi.fn()
      const batcher = new UpdateBatcher(processor, 100)

      batcher.flush()
      expect(processor).not.toHaveBeenCalled()
    })
  })

  describe('rafThrottle', () => {
    it('应该使用 requestAnimationFrame 节流', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

      throttled('arg1')
      expect(fn).not.toHaveBeenCalled()
      expect(rafSpy).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时只请求一次 RAF', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

      throttled()
      throttled()
      throttled()

      expect(rafSpy).toHaveBeenCalledTimes(1)
    })

    it('应该使用最后一次调用的参数', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)
      let rafCallback: FrameRequestCallback | null = null

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb
        return 1
      })

      throttled('first')
      throttled('second')
      throttled('third')

      if (rafCallback) {
        rafCallback(0)
      }

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })
  })

  describe('memoize', () => {
    it('应该缓存函数结果', () => {
      const fn = vi.fn((x: number) => x * 2)
      const memoized = memoize(fn)

      const result1 = memoized(5)
      const result2 = memoized(5)

      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该为不同参数计算新结果', () => {
      const fn = vi.fn((x: number) => x * 2)
      const memoized = memoize(fn)

      const result1 = memoized(5)
      const result2 = memoized(10)

      expect(result1).toBe(10)
      expect(result2).toBe(20)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('应该支持自定义键函数', () => {
      const fn = vi.fn((obj: { id: number; name: string }) => obj.name.toUpperCase())
      const memoized = memoize(fn, (obj) => String(obj.id))

      const result1 = memoized({ id: 1, name: 'test' })
      const result2 = memoized({ id: 1, name: 'different' })

      expect(result1).toBe('TEST')
      expect(result2).toBe('TEST')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该处理多个参数', () => {
      const fn = vi.fn((a: number, b: number) => a + b)
      const memoized = memoize(fn)

      const result1 = memoized(2, 3)
      const result2 = memoized(2, 3)
      const result3 = memoized(3, 2)

      expect(result1).toBe(5)
      expect(result2).toBe(5)
      expect(result3).toBe(5)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('应该处理复杂对象参数', () => {
      const fn = vi.fn((obj: { a: number; b: number }) => obj.a + obj.b)
      const memoized = memoize(fn)

      const result1 = memoized({ a: 1, b: 2 })
      const result2 = memoized({ a: 1, b: 2 })

      expect(result1).toBe(3)
      expect(result2).toBe(3)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})


