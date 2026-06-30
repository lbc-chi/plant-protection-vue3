import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WeatherMonthlyData } from '@/types/weather'

async function fetchDbData() {
  const response = await fetch('/db.json')
  if (!response.ok) throw new Error('数据加载失败')
  return response.json()
}

interface WeatherMonthlyData {
  months: string[]
  rainfall: number[]
  temperature: number[]
  humidity: number[]
}

export const useWeatherStore = defineStore('weather', () => {
  const weatherData = ref<WeatherMonthlyData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const months = computed(() => weatherData.value?.months ?? [])
  const rainfallData = computed(() => weatherData.value?.rainfall ?? [])
  const temperatureData = computed(() => weatherData.value?.temperature ?? [])
  const humidityData = computed(() => weatherData.value?.humidity ?? [])

  const totalAnnualRainfall = computed(() =>
    rainfallData.value.reduce((sum, val) => sum + val, 0)
  )

  const avgTemperature = computed(() => {
    if (temperatureData.value.length === 0) return 0
    const sum = temperatureData.value.reduce((s, v) => s + v, 0)
    return Number((sum / temperatureData.value.length).toFixed(1))
  })

  const avgHumidity = computed(() => {
    if (humidityData.value.length === 0) return 0
    const sum = humidityData.value.reduce((s, v) => s + v, 0)
    return Number((sum / humidityData.value.length).toFixed(1))
  })

  const maxTemperature = computed(() =>
    temperatureData.value.length > 0 ? Math.max(...temperatureData.value) : 0
  )

  const minTemperature = computed(() =>
    temperatureData.value.length > 0 ? Math.min(...temperatureData.value) : 0
  )

  const maxRainfallMonth = computed(() => {
    const data = rainfallData.value
    if (data.length === 0) return { month: '', value: 0 }
    const maxVal = Math.max(...data)
    const monthIndex = data.indexOf(maxVal)
    return {
      month: months.value[monthIndex] ?? '',
      value: maxVal
    }
  })

  const rainySeasonMonths = computed(() => {
    return rainfallData.value
      .map((val, i) => ({ month: months.value[i], value: val }))
      .filter(item => item.value >= 80)
      .map(item => item.month)
  })

  const temperatureRange = computed(() => ({
    max: maxTemperature.value,
    min: minTemperature.value,
    diff: maxTemperature.value - minTemperature.value
  }))

  const getWeatherByMonth = computed(() => {
    return (month: string): { rainfall: number; temperature: number; humidity: number } | null => {
      const index = months.value.indexOf(month)
      if (index === -1) return null
      return {
        rainfall: rainfallData.value[index],
        temperature: temperatureData.value[index],
        humidity: humidityData.value[index]
      }
    }
  })

  const getSeasonalAverage = computed(() => {
    return (season: 'spring' | 'summer' | 'autumn' | 'winter'): { avgTemp: number; avgHumidity: number; totalRainfall: number } => {
        const seasonMap: Record<string, number[]> = {
          spring: [2, 3, 4],
          summer: [5, 6, 7],
          autumn: [8, 9, 10],
          winter: [11, 12, 1]
        }
        const indices = seasonMap[season]
        let tempSum = 0, humidSum = 0, rainSum = 0
        indices.forEach(i => {
          const idx = i === 1 ? 11 : i - 1
          tempSum += temperatureData.value[idx] ?? 0
          humidSum += humidityData.value[idx] ?? 0
          rainSum += rainfallData.value[idx] ?? 0
        })
        return {
          avgTemp: Number((tempSum / 3).toFixed(1)),
          avgHumidity: Number((humidSum / 3).toFixed(1)),
          totalRainfall: rainSum
        }
      }
  })

  async function fetchWeatherData() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      weatherData.value = data.weatherData as WeatherMonthlyData
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取气象数据失败'
    } finally {
      loading.value = false
    }
  }

  function getMonthIndex(month: string): number {
    return months.value.indexOf(month)
  }

  function resetState() {
    weatherData.value = null
    error.value = null
  }

  return {
    // State
    weatherData,
    loading,
    error,

    // Getters
    months,
    rainfallData,
    temperatureData,
    humidityData,
    totalAnnualRainfall,
    avgTemperature,
    avgHumidity,
    maxTemperature,
    minTemperature,
    maxRainfallMonth,
    rainySeasonMonths,
    temperatureRange,
    getWeatherByMonth,
    getSeasonalAverage,

    // Actions
    fetchWeatherData,
    getMonthIndex,
    resetState
  }
})