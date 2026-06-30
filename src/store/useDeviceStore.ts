import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, DeviceType, DeviceStatus } from '@/types/device'

async function fetchDbData() {
  const response = await fetch('/db.json')
  if (!response.ok) throw new Error('数据加载失败')
  return response.json()
}

interface DeviceCompareData {
  devices: string[]
  months: string[]
  data: Record<string, number[]>
}

export const useDeviceStore = defineStore('device', () => {
  // State
  const deviceList = ref<Device[]>([])
  const deviceCompare = ref<DeviceCompareData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalDevices = computed(() => deviceList.value.length)

  const onlineDevices = computed(() =>
    deviceList.value.filter(d => d.status === 'online')
  )

  const offlineDevices = computed(() =>
    deviceList.value.filter(d => d.status === 'offline')
  )

  const faultDevices = computed(() =>
    deviceList.value.filter(d => d.status === 'fault')
  )

  const onlineRate = computed(() => {
    if (totalDevices.value === 0) return 0
    return Number((onlineDevices.value.length / totalDevices.value * 100).toFixed(1))
  })

  const devicesByType = computed(() => {
    const map = new Map<DeviceType, { typeName: string; count: number; onlineCount: number }>()
    const typeNames: Record<DeviceType, string> = {
      pest_monitoring_lamp: '测报灯',
      sex_pheromone_trap: '性诱器',
      weather_station: '气象站',
      soil_sensor: '土壤传感器',
      camera: '摄像头',
      spore_trap: '孢子捕捉仪',
      light_trap: '杀虫灯',
      other: '其他'
    }
    deviceList.value.forEach(device => {
      const existing = map.get(device.type) ?? {
        typeName: typeNames[device.type] ?? device.type,
        count: 0,
        onlineCount: 0
      }
      existing.count++
      if (device.status === 'online') existing.onlineCount++
      map.set(device.type, existing)
    })
    return Array.from(map.entries()).map(([type, stats]) => ({ type, ...stats }))
  })

  const devicesByRegion = computed(() => {
    const map = new Map<string, { regionName: string; totalCount: number; onlineCount: number }>()
    deviceList.value.forEach(device => {
      const existing = map.get(device.regionId) ?? {
        regionName: device.regionName,
        totalCount: 0,
        onlineCount: 0
      }
      existing.totalCount++
      if (device.status === 'online') existing.onlineCount++
      map.set(device.regionId, existing)
    })
    return Array.from(map.values())
  })

  const compareDeviceNames = computed(() => deviceCompare.value?.devices ?? [])
  const compareMonths = computed(() => deviceCompare.value?.months ?? [])

  function getCompareData(deviceName: string): number[] {
    if (!deviceCompare.value?.data) return []
    return deviceCompare.value.data[deviceName] ?? []
  }

  const getDeviceTotalByMonth = computed(() => {
    return (monthIndex: number): number => {
      let total = 0
      deviceCompare.value?.devices.forEach(name => {
        total += deviceCompare.value!.data[name]?.[monthIndex] ?? 0
      })
      return total
    }
  })

  const mayMonthData = computed(() => {
    const mayIndex = compareMonths.value.indexOf('5月')
    if (mayIndex === -1) return {}
    const result: Record<string, number> = {}
    deviceCompare.value?.devices.forEach(name => {
      result[name] = deviceCompare.value!.data[name]?.[mayIndex] ?? 0
    })
    return result
  })

  // Actions
  async function fetchDeviceData() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDbData()
      deviceList.value = data.deviceList as Device[]
      deviceCompare.value = data.deviceCompare as DeviceCompareData
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取设备数据失败'
    } finally {
      loading.value = false
    }
  }

  function getDeviceById(id: string): Device | undefined {
    return deviceList.value.find(d => d.id === id)
  }

  function getDeviceByCode(code: string): Device | undefined {
    return deviceList.value.find(d => d.code === code)
  }

  function getDevicesByType(type: DeviceType): Device[] {
    return deviceList.value.filter(d => d.type === type)
  }

  function getDevicesByStatus(status: DeviceStatus): Device[] {
    return deviceList.value.filter(d => d.status === status)
  }

  function getDevicesByRegion(regionId: string): Device[] {
    return deviceList.value.filter(d => d.regionId === regionId)
  }

  function searchDevices(keyword: string): Device[] {
    const lowerKeyword = keyword.toLowerCase()
    return deviceList.value.filter(d =>
      d.name.toLowerCase().includes(lowerKeyword) ||
      d.code.toLowerCase().includes(lowerKeyword) ||
      d.regionName.toLowerCase().includes(lowerKeyword)
    )
  }

  function resetState() {
    deviceList.value = []
    deviceCompare.value = null
    error.value = null
  }

  // 直接返回所有状态、计算属性和方法（符合Pinia setup store最佳实践）
  return {
    // State
    deviceList,
    deviceCompare,
    loading,
    error,

    // Getters
    totalDevices,
    onlineDevices,
    offlineDevices,
    faultDevices,
    onlineRate,
    devicesByType,
    devicesByRegion,
    compareDeviceNames,
    compareMonths,
    getDeviceTotalByMonth,
    mayMonthData,

    // Actions
    getCompareData,
    fetchDeviceData,
    getDeviceById,
    getDeviceByCode,
    getDevicesByType,
    getDevicesByStatus,
    getDevicesByRegion,
    searchDevices,
    resetState
  }
})
