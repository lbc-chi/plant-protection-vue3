import { useRouter } from 'vue-router'

export interface NavItem {
  key: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '首页' },
  { key: 'pest', label: '虫害专题' },
  { key: 'stations', label: '站点分布' }
]

const ROUTE_MAP: Record<string, { name: string; fallback: string }> = {
  home: { name: 'Dashboard', fallback: '/' },
  pest: { name: 'PestTopic', fallback: '/pest-topic' },
  stations: { name: 'StationDistribution', fallback: '/station-distribution' }
}

export function useNavigation(currentPage: string) {
  const router = useRouter()

  function handleNavClick(key: string) {
    if (key === currentPage) return

    const route = ROUTE_MAP[key]
    if (!route) return

    router.push({ name: route.name }).catch(() => {
      router.push(route.fallback)
    })
  }

  return {
    navItems: NAV_ITEMS,
    handleNavClick
  }
}