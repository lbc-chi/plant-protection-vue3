import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PestTrendData, HistoryTrendData, LinyiData, PestMonthlyData } from '@/types/pest'

async function fetchDbData() {
  const response = await fetch('/db.json')
  if (!response.ok) throw new Error('数据加载失败')
  return response.json()
}

interface PestTrendData {
  pests: string[]
  months: string[]
  data: Record<string, number[]>
}

interface HistoryTrendData {
  years: number[]
  months: string[]
  data: Record<string, number[]>
}

interface LinyiData {
  cityName: string
  occurrenceArea: number
  preventionArea: number
  monitoringPoints: Array<{
    id: string
    name: string
    area: number
    devices: number
    longitude: number
    latitude: number
  }>
  hazardRate: number
  mainPests: string[]
}

interface PestMonthlyData {
  month: string
  count: number
  density: number
  yearOverYear: number
}

export const usePestStore = defineStore('pest', () => {
  const historyTrend = ref<HistoryTrendData | null>(null)
  const pestTrends = ref<PestTrendData | null>(null)
  const linyiData = ref<LinyiData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const trendYears = computed(() => historyTrend.value?.years ?? [])
  const trendMonths = computed(() => historyTrend.value?.months ?? [])

  const currentYearData = computed(() => {
    if (!historyTrend.value?.years.length) return []
    const latestYear = String(Math.max(...historyTrend.value.years))
    return historyTrend.value.data[latestYear] ?? []
  })

  const previousYearData = computed(() => {
    if (!historyTrend.value?.years || historyTrend.value.years.length < 2) return []
    const sortedYears = [...historyTrend.value.years].sort((a, b) => b - a)
    const prevYear = String(sortedYears[1])
    return historyTrend.value.data[prevYear] ?? []
  })

  const yearOverYearGrowth = computed(() => {
    const current = currentYearData.value
    const previous = previousYearData.value
    if (current.length === 0 || previous.length === 0) return []
    return current.map((val, i) =>
      previous[i] > 0 ? Number(((val - previous[i]) / previous[i] * 100).toFixed(1)) : 0
    )
  })

  const peakMonth = computed(() => {
    const data = currentYearData.value
    if (data.length === 0) return { month: '', value: 0 }
    const maxVal = Math.max(...data)
    const monthIndex = data.indexOf(maxVal)
    return {
      month: trendMonths.value[monthIndex] ?? '',
      value: maxVal
    }
  })

  const totalAnnualDetection = computed(() =>
    currentYearData.value.reduce((sum, val) => sum + val, 0)
  )

  const pestNames = computed(() => pestTrends.value?.pests ?? [])
  const trendMonthsForPest = computed(() => pestTrends.value?.months ?? [])

  const getPestData = computed(() => {
    return (pestName: string): number[] => {
      if (!pestTrends.value?.data) return []
      return pestTrends.value.data[pestName] ?? []
    }
  })

  const getPestTotal = computed(() => {
    return (pestName: string): number => {
      const data = getPestData.value(pestName)
      return data.reduce((sum, val) => sum + val, 0)
    }
  })

  const getPestPeakMonth = computed(() => {
    return (pestName: string): { month: string; value: number } => {
      const data = getPestData.value(pestName)
      if (data.length === 0) return { month: '', value: 0 }
      const maxVal = Math.max(...data)
      const monthIndex = data.indexOf(maxVal)
      return {
        month: trendMonthsForPest.value[monthIndex] ?? '',
        value: maxVal
      }
    }
  })

  const linyiCityName = computed(() => linyiData.value?.cityName ?? '')
  const occurrenceArea = computed(() => linyiData.value?.occurrenceArea ?? 0)
  const preventionArea = computed(() => linyiData.value?.preventionArea ?? 0)
  const monitoringPoints = computed(() => linyiData.value?.monitoringPoints ?? [])
  const hazardRate = computed(() => linyiData.value?.hazardRate ?? 0)
  const mainPests = computed(() => linyiData.value?.mainPests ?? [])

  const preventionRate = computed(() => {
    if (occurrenceArea.value === 0) return 0
    return Number((preventionArea.value / occurrenceArea.value * 100).toFixed(1))
  })

  const totalMonitoringDevices = computed(() =>
    monitoringPoints.value.reduce((sum, point) => sum + point.devices, 0)
  )

  async function fetchPestData() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      historyTrend.value = data.historyTrend as HistoryTrendData
      pestTrends.value = data.pestTrends as PestTrendData
      linyiData.value = data.linyiData as LinyiData
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取虫害数据失败'
    } finally {
      loading.value = false
    }
  }

  function getHistoryDataByYear(year: number | string): number[] {
    const yearKey = String(year)
    return historyTrend.value?.data[yearKey] ?? []
  }

  function getMonthlyComparison(monthIndex: number): Record<string, number> {
    if (!historyTrend.value?.years) return {}
    const result: Record<string, number> = {}
    historyTrend.value.years.forEach(year => {
      const yearData = historyTrend.value!.data[String(year)]
      result[String(year)] = yearData?.[monthIndex] ?? 0
    })
    return result
  }

  function getMonitoringPointById(id: string) {
    return monitoringPoints.value.find(point => point.id === id)
  }

  function resetState() {
    historyTrend.value = null
    pestTrends.value = null
    linyiData.value = null
    error.value = null
  }

  return {
    // State
    historyTrend,
    pestTrends,
    linyiData,
    loading,
    error,

    // Getters
    trendYears,
    trendMonths,
    currentYearData,
    previousYearData,
    yearOverYearGrowth,
    peakMonth,
    totalAnnualDetection,
    pestNames,
    trendMonthsForPest,
    getPestData,
    getPestTotal,
    getPestPeakMonth,
    linyiCityName,
    occurrenceArea,
    preventionArea,
    monitoringPoints,
    hazardRate,
    mainPests,
    preventionRate,
    totalMonitoringDevices,

    // Actions
    fetchPestData,
    getHistoryDataByYear,
    getMonthlyComparison,
    getMonitoringPointById,
    resetState
  }
})