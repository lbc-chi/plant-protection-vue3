import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectStatsData, RegionListItem } from '@/types/project'

async function fetchDbData() {
  const response = await fetch('/db.json')
  if (!response.ok) throw new Error('数据加载失败')
  return response.json()
}

interface ProjectStatsData {
  totalStations: number
  totalDevices: number
  reportCount: number
  lampTrapCount: number
  sexPheromoneCount: number
  bioControlCount: number
  coverageArea: number
  onlineRate: number
  avgResponseTime: string
}

interface RegionListItem {
  id: string
  name: string
  code: string
  level: string
  parentId?: string
  children?: RegionListItem[]
  longitude?: number
  latitude?: number
  area?: number
}

export const useProjectStore = defineStore('project', () => {
  const projectStats = ref<ProjectStatsData | null>(null)
  const regionList = ref<RegionListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalStations = computed(() => projectStats.value?.totalStations ?? 0)
  const totalDevices = computed(() => projectStats.value?.totalDevices ?? 0)
  const reportCount = computed(() => projectStats.value?.reportCount ?? 0)
  const lampTrapCount = computed(() => projectStats.value?.lampTrapCount ?? 0)
  const sexPheromoneCount = computed(() => projectStats.value?.sexPheromoneCount ?? 0)
  const bioControlCount = computed(() => projectStats.value?.bioControlCount ?? 0)
  const coverageArea = computed(() => projectStats.value?.coverageArea ?? 0)
  const onlineRate = computed(() => projectStats.value?.onlineRate ?? 0)
  const avgResponseTime = computed(() => projectStats.value?.avgResponseTime ?? '-')

  const statsArray = computed(() => [
    { label: '站点数', value: totalStations.value, unit: '个' },
    { label: '设备数', value: totalDevices.value, unit: '个' },
    { label: '青报数', value: reportCount.value, unit: '个' },
    { label: '灯诱数', value: lampTrapCount.value, unit: '个' },
    { label: '性诱数', value: sexPheromoneCount.value, unit: '个' },
    { label: '生防数', value: bioControlCount.value, unit: '个' }
  ])

  const provinceList = computed(() => regionList.value)

  const cityList = computed(() => {
    const cities: RegionListItem[] = []
    regionList.value.forEach(province => {
      if (province.children) {
        cities.push(...province.children)
      }
    })
    return cities
  })

  const countyList = computed(() => {
    const counties: RegionListItem[] = []
    regionList.value.forEach(province => {
      province.children?.forEach(city => {
        if (city.children) {
          counties.push(...city.children)
        }
      })
    })
    return counties
  })

  const linyiCounties = computed(() => {
    const linyiCity = cityList.value.find(c => c.name === '临沂市')
    return linyiCity?.children ?? []
  })

  const totalRegions = computed(() => {
    let count = 0
    const countRecursive = (items: RegionListItem[]) => {
      items.forEach(item => {
        count++
        if (item.children) {
          countRecursive(item.children)
        }
      })
    }
    countRecursive(regionList.value)
    return count
  })

  async function fetchProjectData() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      projectStats.value = data.projectStats as ProjectStatsData
      regionList.value = data.regionList as RegionListItem[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取工程数据失败'
    } finally {
      loading.value = false
    }
  }

  function getRegionById(id: string): RegionListItem | undefined {
    const findInList = (list: RegionListItem[]): RegionListItem | undefined => {
      for (const item of list) {
        if (item.id === id) return item
        if (item.children) {
          const found = findInList(item.children)
          if (found) return found
        }
      }
      return undefined
    }
    return findInList(regionList.value)
  }

  function getRegionByName(name: string): RegionListItem | undefined {
    const findInList = (list: RegionListItem[]): RegionListItem | undefined => {
      for (const item of list) {
        if (item.name === name) return item
        if (item.children) {
          const found = findInList(item.children)
          if (found) return found
        }
      }
      return undefined
    }
    return findInList(regionList.value)
  }

  function getChildrenRegions(parentId: string): RegionListItem[] {
    const parent = getRegionById(parentId)
    return parent?.children ?? []
  }

  function searchRegions(keyword: string): RegionListItem[] {
    const lowerKeyword = keyword.toLowerCase()
    const results: RegionListItem[] = []

    const searchInList = (list: RegionListItem[]) => {
      list.forEach(item => {
        if (
          item.name.toLowerCase().includes(lowerKeyword) ||
          item.code.toLowerCase().includes(lowerKeyword)
        ) {
          results.push(item)
        }
        if (item.children) {
          searchInList(item.children)
        }
      })
    }
    searchInList(regionList.value)
    return results
  }

  function resetState() {
    projectStats.value = null
    regionList.value = []
    error.value = null
  }

  return {
    // State
    projectStats,
    regionList,
    loading,
    error,

    // Getters
    totalStations,
    totalDevices,
    reportCount,
    lampTrapCount,
    sexPheromoneCount,
    bioControlCount,
    coverageArea,
    onlineRate,
    avgResponseTime,
    statsArray,
    provinceList,
    cityList,
    countyList,
    linyiCounties,
    totalRegions,

    // Actions
    fetchProjectData,
    getRegionById,
    getRegionByName,
    getChildrenRegions,
    searchRegions,
    resetState
  }
})