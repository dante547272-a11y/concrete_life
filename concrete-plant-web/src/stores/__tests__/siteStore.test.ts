import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSiteStore, Site } from '../siteStore'

describe('siteStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    const { setState } = useSiteStore
    setState({
      currentSiteId: '1',
      sites: [
        {
          id: '1',
          name: '杭州总站',
          code: 'HZ001',
          address: '浙江省杭州市余杭区良渚街道',
          status: 'active',
          manager: '张三',
          phone: '13800138001',
          createdAt: '2022-01-01',
        },
        {
          id: '2',
          name: '宁波分站',
          code: 'NB001',
          address: '浙江省宁波市鄞州区',
          status: 'active',
          manager: '李四',
          phone: '13800138002',
          createdAt: '2022-06-15',
        },
      ],
    })
  })

  describe('初始状态', () => {
    it('应该有默认的当前站点', () => {
      const { result } = renderHook(() => useSiteStore())

      expect(result.current.currentSiteId).toBe('1')
    })

    it('应该有默认的站点列表', () => {
      const { result } = renderHook(() => useSiteStore())

      expect(result.current.sites).toHaveLength(2)
      expect(result.current.sites[0].name).toBe('杭州总站')
    })

    it('应该能获取当前站点', () => {
      const { result } = renderHook(() => useSiteStore())

      const currentSite = result.current.getCurrentSite()
      expect(currentSite).toBeDefined()
      expect(currentSite?.id).toBe('1')
      expect(currentSite?.name).toBe('杭州总站')
    })
  })

  describe('setCurrentSite', () => {
    it('应该切换当前站点', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('2')
      })

      expect(result.current.currentSiteId).toBe('2')
      expect(result.current.getCurrentSite()?.name).toBe('宁波分站')
    })

    it('应该允许设置不存在的站点ID', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('999')
      })

      expect(result.current.currentSiteId).toBe('999')
      expect(result.current.getCurrentSite()).toBeUndefined()
    })
  })

  describe('addSite', () => {
    it('应该添加新站点', () => {
      const { result } = renderHook(() => useSiteStore())

      const newSite: Site = {
        id: '3',
        name: '温州分站',
        code: 'WZ001',
        address: '浙江省温州市龙湾区',
        status: 'active',
        manager: '王五',
        phone: '13800138003',
        createdAt: '2023-03-20',
      }

      act(() => {
        result.current.addSite(newSite)
      })

      expect(result.current.sites).toHaveLength(3)
      expect(result.current.sites[2]).toEqual(newSite)
    })

    it('应该保持站点顺序', () => {
      const { result } = renderHook(() => useSiteStore())

      const site1: Site = {
        id: '3',
        name: '站点3',
        code: 'S003',
        address: '地址3',
        status: 'active',
        manager: '经理3',
        phone: '13800138003',
        createdAt: '2023-01-01',
      }

      const site2: Site = {
        id: '4',
        name: '站点4',
        code: 'S004',
        address: '地址4',
        status: 'active',
        manager: '经理4',
        phone: '13800138004',
        createdAt: '2023-02-01',
      }

      act(() => {
        result.current.addSite(site1)
        result.current.addSite(site2)
      })

      expect(result.current.sites).toHaveLength(4)
      expect(result.current.sites[2].id).toBe('3')
      expect(result.current.sites[3].id).toBe('4')
    })
  })

  describe('updateSite', () => {
    it('应该更新站点信息', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.updateSite('1', { name: '杭州总站（更新）', status: 'maintenance' })
      })

      const updatedSite = result.current.sites.find(s => s.id === '1')
      expect(updatedSite?.name).toBe('杭州总站（更新）')
      expect(updatedSite?.status).toBe('maintenance')
      expect(updatedSite?.code).toBe('HZ001') // 其他字段保持不变
    })

    it('应该只更新指定的字段', () => {
      const { result } = renderHook(() => useSiteStore())

      const originalSite = result.current.sites.find(s => s.id === '1')

      act(() => {
        result.current.updateSite('1', { manager: '新经理' })
      })

      const updatedSite = result.current.sites.find(s => s.id === '1')
      expect(updatedSite?.manager).toBe('新经理')
      expect(updatedSite?.name).toBe(originalSite?.name)
      expect(updatedSite?.code).toBe(originalSite?.code)
    })

    it('应该在站点不存在时不做任何操作', () => {
      const { result } = renderHook(() => useSiteStore())

      const originalLength = result.current.sites.length

      act(() => {
        result.current.updateSite('999', { name: '不存在的站点' })
      })

      expect(result.current.sites).toHaveLength(originalLength)
      expect(result.current.sites.find(s => s.id === '999')).toBeUndefined()
    })
  })

  describe('deleteSite', () => {
    it('应该删除站点', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.deleteSite('2')
      })

      expect(result.current.sites).toHaveLength(1)
      expect(result.current.sites.find(s => s.id === '2')).toBeUndefined()
    })

    it('应该在删除当前站点时切换到第一个站点', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('2')
      })

      expect(result.current.currentSiteId).toBe('2')

      act(() => {
        result.current.deleteSite('2')
      })

      expect(result.current.currentSiteId).toBe('1')
    })

    it('应该在删除非当前站点时保持当前站点不变', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('1')
      })

      act(() => {
        result.current.deleteSite('2')
      })

      expect(result.current.currentSiteId).toBe('1')
    })

    it('应该在删除所有站点后设置空ID', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.deleteSite('1')
        result.current.deleteSite('2')
      })

      expect(result.current.sites).toHaveLength(0)
      expect(result.current.currentSiteId).toBe('')
    })

    it('应该在站点不存在时不做任何操作', () => {
      const { result } = renderHook(() => useSiteStore())

      const originalLength = result.current.sites.length

      act(() => {
        result.current.deleteSite('999')
      })

      expect(result.current.sites).toHaveLength(originalLength)
    })
  })

  describe('getCurrentSite', () => {
    it('应该返回当前站点', () => {
      const { result } = renderHook(() => useSiteStore())

      const currentSite = result.current.getCurrentSite()
      expect(currentSite).toBeDefined()
      expect(currentSite?.id).toBe('1')
    })

    it('应该在切换站点后返回新的当前站点', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('2')
      })

      const currentSite = result.current.getCurrentSite()
      expect(currentSite?.id).toBe('2')
      expect(currentSite?.name).toBe('宁波分站')
    })

    it('应该在当前站点不存在时返回 undefined', () => {
      const { result } = renderHook(() => useSiteStore())

      act(() => {
        result.current.setCurrentSite('999')
      })

      const currentSite = result.current.getCurrentSite()
      expect(currentSite).toBeUndefined()
    })
  })

  describe('复杂场景', () => {
    it('应该支持完整的 CRUD 操作流程', () => {
      const { result } = renderHook(() => useSiteStore())

      // Create
      const newSite: Site = {
        id: '3',
        name: '温州分站',
        code: 'WZ001',
        address: '浙江省温州市龙湾区',
        status: 'active',
        manager: '王五',
        phone: '13800138003',
        createdAt: '2023-03-20',
      }

      act(() => {
        result.current.addSite(newSite)
      })

      expect(result.current.sites).toHaveLength(3)

      // Read
      act(() => {
        result.current.setCurrentSite('3')
      })

      expect(result.current.getCurrentSite()?.name).toBe('温州分站')

      // Update
      act(() => {
        result.current.updateSite('3', { status: 'maintenance' })
      })

      expect(result.current.getCurrentSite()?.status).toBe('maintenance')

      // Delete
      act(() => {
        result.current.deleteSite('3')
      })

      expect(result.current.sites).toHaveLength(2)
      expect(result.current.currentSiteId).toBe('1')
    })

    it('应该处理多个站点的批量操作', () => {
      const { result } = renderHook(() => useSiteStore())

      const sites: Site[] = [
        {
          id: '3',
          name: '站点3',
          code: 'S003',
          address: '地址3',
          status: 'active',
          manager: '经理3',
          phone: '13800138003',
          createdAt: '2023-01-01',
        },
        {
          id: '4',
          name: '站点4',
          code: 'S004',
          address: '地址4',
          status: 'active',
          manager: '经理4',
          phone: '13800138004',
          createdAt: '2023-02-01',
        },
        {
          id: '5',
          name: '站点5',
          code: 'S005',
          address: '地址5',
          status: 'active',
          manager: '经理5',
          phone: '13800138005',
          createdAt: '2023-03-01',
        },
      ]

      act(() => {
        sites.forEach(site => result.current.addSite(site))
      })

      expect(result.current.sites).toHaveLength(5)

      act(() => {
        result.current.updateSite('3', { status: 'maintenance' })
        result.current.updateSite('4', { status: 'inactive' })
      })

      expect(result.current.sites.find(s => s.id === '3')?.status).toBe('maintenance')
      expect(result.current.sites.find(s => s.id === '4')?.status).toBe('inactive')
    })
  })
})


