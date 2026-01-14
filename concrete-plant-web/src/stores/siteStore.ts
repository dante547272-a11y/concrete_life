/**
 * Site Store - 站点状态管理
 * 管理当前选中的站点和站点列表
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  manager: string;
  phone: string;
  createdAt: string;
}

interface SiteState {
  currentSiteId: string;
  sites: Site[];
  setCurrentSite: (siteId: string) => void;
  addSite: (site: Site) => void;
  updateSite: (id: string, site: Partial<Site>) => void;
  deleteSite: (id: string) => void;
  getCurrentSite: () => Site | undefined;
}

// 默认站点数据
const defaultSites: Site[] = [
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
  {
    id: '3',
    name: '温州分站',
    code: 'WZ001',
    address: '浙江省温州市龙湾区',
    status: 'active',
    manager: '王五',
    phone: '13800138003',
    createdAt: '2023-03-20',
  },
  {
    id: '4',
    name: '嘉兴分站',
    code: 'JX001',
    address: '浙江省嘉兴市南湖区',
    status: 'maintenance',
    manager: '赵六',
    phone: '13800138004',
    createdAt: '2023-08-10',
  },
  {
    id: '5',
    name: '绍兴分站',
    code: 'SX001',
    address: '浙江省绍兴市越城区',
    status: 'inactive',
    manager: '钱七',
    phone: '13800138005',
    createdAt: '2024-01-05',
  },
];

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      currentSiteId: '1',
      sites: defaultSites,
      
      setCurrentSite: (siteId: string) => set({ currentSiteId: siteId }),
      
      addSite: (site: Site) => set((state) => ({ 
        sites: [...state.sites, site] 
      })),
      
      updateSite: (id: string, updates: Partial<Site>) => set((state) => ({
        sites: state.sites.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      
      deleteSite: (id: string) => set((state) => ({
        sites: state.sites.filter(s => s.id !== id),
        currentSiteId: state.currentSiteId === id ? state.sites[0]?.id || '' : state.currentSiteId
      })),
      
      getCurrentSite: () => {
        const state = get();
        return state.sites.find(s => s.id === state.currentSiteId);
      },
    }),
    {
      name: 'site-storage',
    }
  )
);
