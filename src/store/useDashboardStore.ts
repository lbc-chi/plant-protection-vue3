import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DashboardData, CorridorData, AlertItem, ActivityItem } from '@/types/dashboard'

// ===== V2 数据类型定义 =====
interface CityRankingItem {
  name: string
  count: number
  percent: number
}

interface DeviceSeriesItem {
  name: string
  data: number[]
  color: string
}

interface BandAreaSeriesItem {
  name: string
  type: string
  data: number[]
  color: string
}

interface MapCityMarker {
  city: string
  x: number
  y: number
  value: number
}

interface BottomStatsCard {
  label: string
  value: string
}

interface TrendGauge {
  city: string
  value: number
  current: number
  total: number
}

interface FundTag {
  label: string
  active: boolean
  disabled: boolean
}

interface BrandTableItem {
  icon: string
  name: string
  count: number
  ratio: string
  defectRate: string
}

interface DistrictTableRow {
  index: number
  district: string
  stationName: string
  buildTime: string
  location: string
}

interface CityGrowthTableRow {
  index: number
  cityName: string
  increaseCount: number | string
  growthRate: string
}

// ===== V3 数据类型定义（原型图V3版）=====
interface DashboardV3Data {
  platformInfo: {
    title: string
    version: string
    weather: { temperature: string; condition: string }
    datetime: string
  }
  topTabs: string[]
  leftNavMenu: {
    modeA_functional: any[]
    modeB_administrative: {
      title: string
      currentProvince: string
      cities: { name: string; districts: string[] }[]
    }
  }
  centerArea: {
    pestTabs: string[]
    monthOptions: string[]
    selectedMonth: string
    heatmapData: {
      legendRanges: { min?: number; max?: number; color: string; label: string }[]
      cityHeatValues: { city: string; value: number; lat: number; lng: number }[]
    }
    bottomButtons: string[]
    videoCards: { id: string; title: string; region: string; thumbnail: string; status: string }[]
    pestLineCharts: {
      sprayPestChart: { title: string; months: string[]; series: { name: string; data: number[]; color: string }[] }
      sexLureChart: { title: string; months: string[]; series: { name: string; data: number[]; color: string }[] }
    }
    cityPopupData: {
      template: Record<string, string>
      examples: Record<string, any>
    }
  }
  rightPanel: {
    title: string
    statCards: { label: string; value: number; icon: string; unit: string }[]
    imageGalleries: {
      trapLightGallery: { title: string; images: { id: string; url: string; caption: string }[] }
      microscopeGallery: { title: string; images: { id: string; url: string; caption: string }[] }
    }
  }
}

interface DashboardV2Data {
  platformInfo: {
    title: string
    version: string
    updateTime: string
  }
  module1_cityRanking: CityRankingItem[]
  module2_deviceAnalysis: {
    years: string[]
    series: DeviceSeriesItem[]
  }
  module3_bandData: {
    years: string[]
    areaSeries: BandAreaSeriesItem[]
  }
  module4_mapData: {
    yearOptions: number[]
    selectedYear: number
    cityMarkers: MapCityMarker[]
    bottomStatsCards: BottomStatsCard[]
  }
  module5_trendGauges: TrendGauge[]
  module6_usageRate: {
    usagePercent: number
    usageTotal: number
    fundLabel: string
    fundTags: FundTag[]
  }
  module7_brandTable: BrandTableItem[]
  modal1_districtTable: {
    columns: { key: string; label: string; width?: number }[]
    data: DistrictTableRow[]
    pagination: { current: number; pageSize: number; total: number }
  }
  modal2_cityGrowthTable: {
    columns: { key: string; label: string; width?: number }[]
    data: CityGrowthTableRow[]
    pagination: { current: number; pageSize: number; total: number }
  }
}

async function fetchDbData() {
  const response = await fetch('/db.json')
  if (!response.ok) throw new Error('数据加载失败')
  return response.json()
}

export const useDashboardStore = defineStore('dashboard', () => {
  // ===== State (旧版 + V2版 + V3版) =====
  const dashboardData = ref<DashboardData | null>(null)
  const dashboardV2Data = ref<DashboardV2Data | null>(null)
  const dashboardV3Data = ref<DashboardV3Data | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // ===== 地图交互状态 =====
  const selectedCityOnMap = ref<string>('')

  // ===== 新组件数据状态（PestScatterPlot / RightTopCharts）=====
  const pestScatterData = ref<any>(null)
  const trendsData = ref<any>(null)

  // ===== Getters - 旧版数据接口（保持向后兼容） =====
  const overview = computed(() => dashboardData.value?.overview ?? null)
  const corridorData = computed<CorridorData[]>(() => dashboardData.value?.corridorData ?? [])
  const collectionMetrics = computed(() => dashboardData.value?.collectionMetrics ?? null)
  const alerts = computed<AlertItem[]>(() => dashboardData.value?.alerts ?? [])
  const recentActivities = computed<ActivityItem[]>(() => dashboardData.value?.recentActivities ?? [])

  const totalCollectionValue = computed(() =>
    corridorData.value.reduce((sum, item) => sum + item.value, 0)
  )

  const avgCompletionRate = computed(() => {
    if (corridorData.value.length === 0) return 0
    const total = corridorData.value.reduce((sum, item) => sum + item.completionRate, 0)
    return Number((total / corridorData.value.length).toFixed(1))
  })

  const pendingAlerts = computed(() =>
    alerts.value.filter(alert => alert.status === 'pending')
  )

  const alertStats = computed(() => {
    const stats = { info: 0, warning: 0, error: 0, critical: 0 }
    alerts.value.forEach(alert => {
      stats[alert.level]++
    })
    return stats
  })

  // ===== Getters - V2新版数据接口（核心对接点） =====

  // 平台信息
  const platformInfo = computed(() => dashboardV2Data.value?.platformInfo ?? null)

  // 模块1：各市站点排行
  const cityRankingData = computed<CityRankingItem[]>(
    () => dashboardV2Data.value?.module1_cityRanking ?? []
  )

  // 模块2：设备类型分析
  const deviceAnalysisYears = computed<string[]>(
    () => dashboardV2Data.value?.module2_deviceAnalysis.years ?? []
  )
  const deviceTypeSeries = computed<DeviceSeriesItem[]>(
    () => dashboardV2Data.value?.module2_deviceAnalysis.series ?? []
  )

  // 模块3：带状数据量分析
  const bandDataYears = computed<string[]>(
    () => dashboardV2Data.value?.module3_bandData.years ?? []
  )
  const bandDataAreaSeries = computed<BandAreaSeriesItem[]>(
    () => dashboardV2Data.value?.module3_bandData.areaSeries ?? []
  )

  // 模块4：地图数据
  const yearOptions = computed<number[]>(
    () => dashboardV2Data.value?.module4_mapData.yearOptions ?? [2024, 2023, 2022]
  )
  const mapCityMarkers = computed<MapCityMarker[]>(
    () => dashboardV2Data.value?.module4_mapData.cityMarkers ?? []
  )
  const bottomStatsCards = computed<BottomStatsCard[]>(
    () => dashboardV2Data.value?.module4_mapData.bottomStatsCards ?? []
  )

  // 模块5：趋势仪表盘
  const trendGauges = computed<TrendGauge[]>(
    () => dashboardV2Data.value?.module5_trendGauges ?? []
  )

  // 模块6：使用率分析
  const usageRateInfo = computed(() => dashboardV2Data.value?.module6_usageRate ?? null)
  const fundTags = computed<FundTag[]>(
    () => dashboardV2Data.value?.module6_usageRate.fundTags ?? []
  )

  // 模块7：品牌表格
  const brandTableData = computed<BrandTableItem[]>(
    () => dashboardV2Data.value?.module7_brandTable ?? []
  )

  // 弹窗1：区县建设情况表
  const districtTableColumns = computed(
    () => dashboardV2Data.value?.modal1_districtTable.columns ?? []
  )
  const districtTableData = computed<DistrictTableRow[]>(
    () => dashboardV2Data.value?.modal1_districtTable.data ?? []
  )
  const districtPagination = computed(
    () => dashboardV2Data.value?.modal1_districtTable.pagination ?? { current: 1, pageSize: 14, total: 14 }
  )

  // 弹窗2：市级增幅情况表
  const cityGrowthColumns = computed(
    () => dashboardV2Data.value?.modal2_cityGrowthTable.columns ?? []
  )
  const cityGrowthTableData = computed<CityGrowthTableRow[]>(
    () => dashboardV2Data.value?.modal2_cityGrowthTable.data ?? []
  )
  const cityGrowthPagination = computed(
    () => dashboardV2Data.value?.modal2_cityGrowthTable.pagination ?? { current: 1, pageSize: 12, total: 12 }
  )

  // ===== 地图交互方法 =====
  function setSelectedCityOnMap(cityName: string) {
    selectedCityOnMap.value = cityName
    console.log('[Store] 🗺️ 地图选中城市已更新:', cityName)
  }

  // ===== 新组件数据方法 =====
  function setPestScatterData(data: any) {
    pestScatterData.value = data
    console.log('[Store] 🎯 虫害散点数据已更新:', data?.points?.length, '个点位')
  }

  function setTrendsData(data: any) {
    trendsData.value = data
    console.log('[Store] 📈 趋势数据已更新:', data?.series?.length, '条曲线')
  }

  // ===== Actions =====

  async function fetchDashboardData() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      // 同时加载旧版和V2版数据
      dashboardData.value = data.dashboard as DashboardData
      dashboardV2Data.value = data.dashboardV2 as DashboardV2Data
      console.log('[Store] ✅ 旧版+V2版数据加载完成')
      console.log('[Store] 📊 V2平台信息:', platformInfo.value?.title)
      console.log('[Store] 🏙️ 城市排行数据:', cityRankingData.value.length, '条')
      console.log('[Store] 📈 设备趋势系列:', deviceTypeSeries.value.length, '条')
      console.log('[Store] 🗺️ 地图标记数量:', mapCityMarkers.value.length, '个')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取仪表盘数据失败'
      console.error('[Store] ❌ 数据加载失败:', error.value)
    } finally {
      loading.value = false
    }
  }

  // 仅加载V2数据（用于大屏页面）
  async function fetchDashboardV2Data() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      dashboardV2Data.value = data.dashboardV2 as DashboardV2Data
      console.log('[Store-V2] ✅ 大屏V2数据加载完成')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取大屏V2数据失败'
      console.error('[Store-V2] ❌ 加载失败:', error.value)
    } finally {
      loading.value = false
    }
  }

  // 仅加载V3数据（用于新版首页）
  async function fetchDashboardV3Data() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      dashboardV3Data.value = data.dashboardV3 as DashboardV3Data
      console.log('[Store-V3] ✅ 大屏V3数据加载完成')
      console.log('[Store-V3] 📊 平台标题:', dashboardV3Data.value?.platformInfo?.title)
      console.log('[Store-V3] 🗺️ 热力图城市数:', dashboardV3Data.value?.centerArea?.heatmapData?.cityHeatValues?.length || 0)
      console.log('[Store-V3] 📈 统计卡片:', dashboardV3Data.value?.rightPanel?.statCards?.length || 0, '个')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取大屏V3数据失败'
      console.error('[Store-V3] ❌ 加载失败:', error.value)
    } finally {
      loading.value = false
    }
  }

  // 旧版辅助函数（保持兼容）
  function getCorridorById(id: string): CorridorData | undefined {
    return corridorData.value.find(item => item.id === id)
  }

  function getAlertById(id: string): AlertItem | undefined {
    return alerts.value.find(item => item.id === id)
  }

  function getActivityById(id: string): ActivityItem | undefined {
    return recentActivities.value.find(item => item.id === id)
  }

  function filterAlertsByLevel(level: AlertItem['level']): AlertItem[] {
    return alerts.value.filter(alert => alert.level === level)
  }

  function filterActivitiesByType(type: ActivityItem['type']): ActivityItem[] {
    return recentActivities.value.filter(activity => activity.type === type)
  }

  function resetState() {
    dashboardData.value = null
    dashboardV2Data.value = null
    error.value = null
  }

  // ===== 返回所有状态、计算属性和方法 =====
  return {
    // State
    dashboardData,
    dashboardV2Data,
    dashboardV3Data,
    loading,
    error,
    
    // 地图交互状态
    selectedCityOnMap,

    // 新组件数据状态
    pestScatterData,
    trendsData,

    // Getters - 旧版（向后兼容）
    overview,
    corridorData,
    collectionMetrics,
    alerts,
    recentActivities,
    totalCollectionValue,
    avgCompletionRate,
    pendingAlerts,
    alertStats,

    // Getters - V2新版（🎯 核心对接）
    platformInfo,
    cityRankingData,
    deviceAnalysisYears,
    deviceTypeSeries,
    bandDataYears,
    bandDataAreaSeries,
    yearOptions,
    mapCityMarkers,
    bottomStatsCards,
    trendGauges,
    usageRateInfo,
    fundTags,
    brandTableData,
    districtTableColumns,
    districtTableData,
    districtPagination,
    cityGrowthColumns,
    cityGrowthTableData,
    cityGrowthPagination,

    // Actions
    fetchDashboardData,
    fetchDashboardV2Data,
    fetchDashboardV3Data,
    setSelectedCityOnMap,
    setPestScatterData,
    setTrendsData,
    getCorridorById,
    getAlertById,
    getActivityById,
    filterAlertsByLevel,
    filterActivitiesByType,
    resetState
  }
})
