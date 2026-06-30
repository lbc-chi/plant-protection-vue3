<template>
  <div class="pest-center-map">
    <div class="pcm-container">
      <!-- 顶部虫种Tab -->
      <div class="pcm-header">
        <div class="pcm-tabs">
          <button
            v-for="tab in pestTabs"
            :key="tab.key"
            :class="['pcm-tab', { 'pcm-tab--active': activePestTab === tab.key }]"
            @click="activePestTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 主体：中央区域（地图+标题+时间线） -->
      <div class="pcm-body">

        <!-- ========== 中央区域（地图+标题+时间线）========== -->
        <div class="pcm-main-area">
          <div class="pcm-title-bar">
            <div class="pcm-title-left">
              <span class="pcm-calendar-icon">📅</span>
              <select v-model="selectedYear" class="pcm-year-select">
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
              <div class="breadcrumb-nav-title">
                <span
                  class="breadcrumb-item"
                  :class="{ 'breadcrumb-item--active': currentMapLevel === 'province' }"
                  @click="currentMapLevel !== 'province' && resetToProvince()"
                >
                  山东省
                </span>
                <span v-if="currentMapLevel === 'city' || currentMapLevel === 'county'" class="breadcrumb-separator">/</span>
                <span
                  v-if="currentMapLevel === 'city' || currentMapLevel === 'county'"
                  class="breadcrumb-item"
                  :class="{
                    'breadcrumb-item--active': currentMapLevel === 'city',
                    'breadcrumb-item--clickable': currentMapLevel === 'county'
                  }"
                  @click="currentMapLevel === 'county' && backToPreviousLevel()"
                >
                  {{ currentCityName }}
                </span>
                <span v-if="currentMapLevel === 'county'" class="breadcrumb-separator">/</span>
                <span v-if="currentMapLevel === 'county'" class="breadcrumb-item breadcrumb-item--current">
                  {{ currentCountyName }}
                </span>
              </div>
              <h3 class="pcm-title">{{ mapTitle }}</h3>
            </div>
            <div class="pcm-date-range">{{ dateRangeText }}</div>
          </div>

          <div class="pcm-timeline">
            <button
              v-for="(date, idx) in timelineDates"
              :key="date"
              :class="['pcm-timeline-item', { 'pcm-timeline-item--active': selectedDate === date }]"
              @click="selectedDate = date"
            >
              {{ date }}
            </button>
            <span v-for="idx in timelineDates.length - 1" :key="'arrow-' + idx" class="pcm-timeline-arrow">→</span>
          </div>

          <div class="pcm-map-wrapper">
            <!-- 返回上级地图按钮（市级或县级地图时显示） -->
            <Transition name="back-btn-fade">
              <button
                v-if="currentMapLevel !== 'province'"
                class="pcm-back-btn"
                @click="backToPreviousLevel"
                :disabled="isMapTransitioning"
              >
                <span class="back-icon">←</span>
                <span class="back-text">{{ backButtonText }}</span>
              </button>
            </Transition>

            <!-- 面包屑导航（显示当前地图层级路径） -->
            <Transition name="breadcrumb-fade">
              <div
                v-if="currentMapLevel !== 'province'"
                class="breadcrumb-nav-pest"
              >
                <span
                  class="breadcrumb-item breadcrumb-item--clickable"
                  @click="resetToProvince"
                >山东省</span>
                <span class="breadcrumb-separator">/</span>
                <span
                  v-if="currentMapLevel === 'city' || currentMapLevel === 'county'"
                  :class="['breadcrumb-item', { 'breadcrumb-item--clickable': currentMapLevel === 'county' }]"
                  @click="currentMapLevel === 'county' && backToPreviousLevel()"
                >{{ currentCityName }}</span>
                <span v-if="currentMapLevel === 'county'" class="breadcrumb-separator">/</span>
                <span
                  v-if="currentMapLevel === 'county'"
                  class="breadcrumb-item breadcrumb-item--current"
                >{{ currentCountyName }}</span>

                <!-- 操作提示 -->
                <span v-if="currentMapLevel === 'city'" class="breadcrumb-hint-pest">
                  👆 点击区县可查看详情
                </span>
              </div>
            </Transition>

            <!-- 加载状态提示 -->
            <Transition name="loading-fade">
              <div v-if="isMapTransitioning" class="pcm-map-loading">
                <div class="loading-spinner"></div>
                <span>{{ loadingText }}</span>
              </div>
            </Transition>

            <div ref="mapContainerRef" class="pcm-map-container"></div>

            <Transition name="popup-fade">
              <div v-if="showCityPopup && selectedCityData" class="pcm-city-popup" :style="popupPosition">
                <div class="pcm-popup-header">
                  <span class="pcm-popup-title">{{ selectedCityData.fullName }}</span>
                  <button class="pcm-popup-close" @click="showCityPopup = false">×</button>
                </div>
                <div class="pcm-popup-body">
                  <div class="pcm-popup-status" :class="{ 'pcm-popup-status--offline': selectedCityData.isOffline }">
                    {{ selectedCityData.isOffline ? '设备离线' : '设备在线' }}
                  </div>
                  <div class="pcm-popup-row">
                    <span class="pcm-popup-label">数据峰值:</span>
                    <span class="pcm-popup-value">{{ selectedCityData.peakValue }}</span>
                  </div>
                  <div class="pcm-popup-row">
                    <span class="pcm-popup-label">监测时间:</span>
                    <span class="pcm-popup-value">{{ selectedCityData.monitorTime }}</span>
                  </div>
                </div>
                <div class="pcm-popup-actions">
                  <button class="pcm-popup-btn pcm-popup-btn--compare">加入对比</button>
                  <button class="pcm-popup-btn pcm-popup-btn--select">选中</button>
                  <button class="pcm-popup-btn pcm-popup-btn--more">更多</button>
                </div>
              </div>
            </Transition>

            <div class="pcm-right-panel">
              <h4 class="pcm-panel-title">灯诱虫量</h4>
              <div class="pcm-panel-options">
                <label
                  v-for="option in lightTrapOptions"
                  :key="option.key"
                  :class="['pcm-radio-item', { 'pcm-radio-item--active': activeLightTrap === option.key }]"
                >
                  <input
                    type="radio"
                    :value="option.key"
                    v-model="activeLightTrap"
                    class="pcm-radio-input"
                  />
                  <span class="pcm-radio-custom"></span>
                  <span class="pcm-radio-label">{{ option.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="pcm-footer">
            <div class="pcm-footer-tabs">
              <button
                v-for="tab in footerTabs"
                :key="tab.key"
                :class="['pcm-footer-tab', { 'pcm-footer-tab--active': activeFooterTab === tab.key }]"
                @click="activeFooterTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="pcm-legend-bar">
              <div class="pcm-legend-gradient" :style="{ background: legendGradient }"></div>
              <div class="pcm-legend-labels">
                <span v-for="item in legendItems" :key="item.label">{{ item.label }}</span>
              </div>
            </div>
            <div class="pcm-compare-info">对比值: {{ compareValue }}</div>
          </div>
        </div><!-- /pcm-main-area -->

      </div><!-- /pcm-body -->
    </div><!-- /pcm-container -->
  </div><!-- /pest-center-map -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from '@/utils/echarts'
import { getLevelColor, getDensityLevel, getLegendGradient, getLegendItems } from '@/composables/usePestDensityLevel'

interface CityBubble {
  name: string
  value: number
  coord: [number, number]
}

interface CityPopupData {
  fullName: string
  isOffline: boolean
  peakValue: string
  monitorTime: string
}

const mapContainerRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const activePestTab = ref('grainCotton')
const selectedYear = ref(2024)
const selectedDate = ref('9-8')
const activeLightTrap = ref('threeDay')
const activeFooterTab = ref('lightTrap')
const showCityPopup = ref(false)
const popupPosition = ref({ top: '100px', left: '200px' })
const compareValue = ref(5)

// 日期系数（模拟不同日期虫量波动，中间日期高两头低）
const DATE_COEFFICIENTS = [
  0.45,   // 9-5
  0.55,   // 9-6
  0.70,   // 9-7
  0.85,   // 9-8
  1.00,   // 9-9 - 峰值
  0.92,   // 9-10
  0.78,   // 9-11
  0.65,   // 9-12
  0.52,   // 9-13
  0.48,   // 9-14
  0.42,   // 9-15
  0.38,   // 9-16
  0.35,   // 9-17
  0.40,   // 9-18
  0.50    // 9-19
]

// 当前选中日期的系数
const currentDateCoeff = computed(() => {
  const idx = timelineDates.indexOf(selectedDate.value)
  return DATE_COEFFICIENTS[idx >= 0 ? idx : 0] ?? 1
})

/** 返回按钮文字（根据当前级别动态显示） */
const backButtonText = computed(() => {
  switch (currentMapLevel.value) {
    case 'city':
      return '返回山东省'
    case 'county':
      return `返回${currentCityName.value}`
    default:
      return '返回上级'
  }
})

/** 加载状态提示文字 */
const loadingText = computed(() => {
  if (currentMapLevel.value === 'city') {
    return `正在加载 ${currentCityName.value} 地图数据...`
  } else if (currentMapLevel.value === 'county') {
    return `正在加载 ${currentCountyName.value} 地图数据...`
  }
  return '正在加载地图数据...'
})

// 地图级别管理（支持三级下钻：省→市→县）
const currentMapLevel = ref<'province' | 'city' | 'county'>('province')
const currentCityName = ref('')
const currentCountyName = ref('')
const isMapTransitioning = ref(false)

// 地图导航历史栈（用于多级返回）
const mapHistoryStack = ref<Array<{
  level: 'province' | 'city' | 'county'
  cityName: string
  countyName?: string
}>>([])

const pestTabs = [
  { key: 'grainCotton', label: '粮棉虫' },
  { key: 'cornBorer', label: '玉米螟' },
  { key: 'locust', label: '蝗虫' }
]

// 各虫种配置：不同的基数、范围、活跃城市、气泡颜色
const pestConfig: Record<string, {
  base: number
  range: number
  activeCities: string[]
  color: string
  colorHigh: string
}> = {
  grainCotton: {
    base: 85,
    range: 35,
    activeCities: ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
    color: '#f59e0b',
    colorHigh: '#ef4444'
  },
  cornBorer: {
    base: 60,
    range: 30,
    activeCities: ['济南市', '淄博市', '枣庄市', '东营市', '潍坊市', '济宁市', '泰安市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
    color: '#10b981',
    colorHigh: '#22c55e'
  },
  locust: {
    base: 40,
    range: 25,
    activeCities: ['东营市', '潍坊市', '滨州市', '德州市', '聊城市', '济南市', '菏泽市'],
    color: '#3b82f6',
    colorHigh: '#60a5fa'
  }
}

// 当前虫害配置
const currentPestConfig = computed(() => pestConfig[activePestTab.value] || pestConfig.grainCotton)

// 根据虫害类型动态生成图例项
const legendItems = computed(() => getLegendItems({
  color: currentPestConfig.value.color,
  colorHigh: currentPestConfig.value.colorHigh,
}))

// 根据虫害类型动态生成图例渐变
const legendGradient = computed(() => getLegendGradient({
  color: currentPestConfig.value.color,
  colorHigh: currentPestConfig.value.colorHigh,
}))

// 所有城市的坐标数据
const allCityCoords: Record<string, [number, number]> = {
  '济南市': [117.0, 36.65],
  '青岛市': [120.35, 36.08],
  '淄博市': [118.05, 36.78],
  '枣庄市': [117.55, 34.85],
  '东营市': [118.67, 37.43],
  '烟台市': [121.39, 37.52],
  '潍坊市': [119.15, 36.7],
  '济宁市': [116.58, 35.42],
  '泰安市': [117.09, 36.18],
  '威海市': [122.13, 37.2],
  '日照市': [119.46, 35.42],
  '临沂市': [118.33, 35.07],
  '德州市': [116.38, 37.45],
  '聊城市': [115.98, 36.47],
  '滨州市': [118.02, 37.38],
  '菏泽市': [115.48, 35.25]
}

const yearOptions = [2020, 2021, 2022, 2023, 2024, 2025]

const timelineDates = [
  '9-5', '9-6', '9-7', '9-8', '9-9', '9-10',
  '9-11', '9-12', '9-13', '9-14', '9-15',
  '9-16', '9-17', '9-18', '9-19'
]

const lightTrapOptions = [
  { key: 'threeDay', label: '三日递增' },
  { key: 'weekCumulative', label: '本周累积' },
  { key: 'monthCumulative', label: '本月累积' },
  { key: 'seasonCumulative', label: '两季累积' }
]

const footerTabs = [
  { key: 'lightTrap', label: '灯诱虫量' },
  { key: 'dailyCount', label: '当日虫量' }
]

// 根据当前选中的虫种和日期动态生成城市气泡数据
const currentCityBubbles = computed((): CityBubble[] => {
  const config = pestConfig[activePestTab.value]
  if (!config) return []

  const coeff = currentDateCoeff.value

  return config.activeCities.map(cityName => {
    // 基于城市名生成稳定的伪随机值（同一虫种同一城市每次值相同）
    let hash = 0
    for (let i = 0; i < cityName.length; i++) {
      hash = cityName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const randomFactor = (Math.abs(hash) % 100) / 100
    // 基础值 × 日期系数，不同日期显示不同数据量
    const baseValue = Math.round((config.base + randomFactor * config.range) * coeff)

    return {
      name: cityName,
      value: Math.max(baseValue, 5), // 最小值为5避免气泡消失
      coord: allCityCoords[cityName] || [117.0, 36.65]
    }
  })
})

const selectedCityData = ref<CityPopupData | null>({
  fullName: '潍坊市历下区蛄虫灯诱',
  isOffline: true,
  peakValue: '2#365天',
  monitorTime: '2023.02.02'
})

const mapTitle = computed(() => {
  const pestName = pestTabs.find(t => t.key === activePestTab.value)?.label || '虫害'
  if (currentMapLevel.value === 'county') {
    return `${currentCityName.value}${currentCountyName.value}${pestName}当日灯诱虫量分布图`
  } else if (currentMapLevel.value === 'city') {
    return `${currentCityName.value}${pestName}当日灯诱虫量分布图`
  }
  return `山东省${pestName}当日灯诱虫量分布图`
})

const dateRangeText = computed(() => {
  const today = new Date()
  const year = selectedYear.value
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}.${month}.${day} - ${year}.${month}.${day}`
})

function getBubbleColor(value: number): string {
  const config = pestConfig[activePestTab.value]
  const bubbles = currentCityBubbles.value
  if (bubbles.length === 0) return config?.color || '#d48806'
  const maxVal = Math.max(...bubbles.map(b => b.value))
  return getLevelColor({ color: config?.color || '#d48806', colorHigh: config?.colorHigh || '#ef4444' }, value, maxVal)
}

function getBubbleSize(value: number): number {
  const bubbles = currentCityBubbles.value
  if (bubbles.length === 0) return 20
  const baseSize = 20
  const maxSize = 40
  const maxVal = Math.max(...bubbles.map(b => b.value))
  return baseSize + (value / maxVal) * (maxSize - baseSize)
}

async function initMap() {
  if (!mapContainerRef.value) return

  try {
    const response = await fetch('/geoJson/shandong.geojson')
    const geoJsonData = await response.json()
    echarts.registerMap('shandong', geoJsonData)

    chartInstance = echarts.init(mapContainerRef.value)
    updateChartOption()

    chartInstance.on('click', (params: any) => {
      console.log('[PestCenterMap] 🗺️ 点击事件:', {
        name: params.name,
        componentType: params.componentType,
        seriesType: params.seriesType,
        currentLevel: currentMapLevel.value
      })

      if (!params.name) return

      // 散点（监测站点）点击 → 不做地图下钻
      const isScatterClick = params.seriesType === 'scatter' || params.seriesType === 'effectScatter'
      if (isScatterClick) {
        console.log('[PestCenterMap] 📍 站点点击:', params.name)
        return
      }

      // 根据当前地图级别执行不同的操作（支持三级下钻）
      switch (currentMapLevel.value) {
        case 'province':
          // 省级地图：点击城市下钻到市级地图（仅有效城市名）
          const city = currentCityBubbles.value.find(b => b.name === params.name)
          if ((city || params.componentType === 'geo') && cityCodeMap[params.name]) {
            console.log('[PestCenterMap] 👆 省级 → 市级:', params.name)
            zoomToCity(params.name, city?.coord || [117.0, 36.65])
          } else {
            console.warn('[PestCenterMap] ⚠️ 非城市区域点击，已忽略:', params.name)
          }
          break

        case 'city':
          // 市级地图：点击区县下钻到县级地图 ⭐ 新增
          console.log('[PestCenterMap] 👆 市级 → 县级:', params.name)
          zoomToCounty(params.name)
          break

        case 'county':
          // 县级地图：显示详情弹窗（最底层）
          console.log('[PestCenterMap] 📍 县级详情:', params.name)
          const countyData = currentCityBubbles.value.find(b => b.name === params.name)
          if (countyData) {
            showCityDetailPopup(countyData, params)
          }
          break

        default:
          console.warn('[PestCenterMap] ⚠️ 未知的地图级别:', currentMapLevel.value)
      }
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
  }
}

// 城市代码映射（用于获取市级 GeoJSON）
const cityCodeMap: Record<string, string> = {
  '济南市': '370100',
  '青岛市': '370200',
  '淄博市': '370300',
  '枣庄市': '370400',
  '东营市': '370500',
  '烟台市': '370600',
  '潍坊市': '370700',
  '济宁市': '370800',
  '泰安市': '370900',
  '威海市': '371000',
  '日照市': '371100',
  '临沂市': '371300',
  '德州市': '371400',
  '聊城市': '371500',
  '滨州市': '371600',
  '菏泽市': '371700'
}

async function zoomToCity(cityName: string, coord: [number, number]) {
  if (!chartInstance || isMapTransitioning.value) return

  isMapTransitioning.value = true

  // 保存当前状态到历史栈（如果当前是省级地图）
  if (currentMapLevel.value === 'province') {
    mapHistoryStack.value.push({
      level: 'province',
      cityName: '',
      countyName: undefined
    })
  }

  currentCityName.value = cityName
  currentCountyName.value = ''

  try {
    const cityCode = cityCodeMap[cityName]
    if (!cityCode) {
      console.warn('[PestCenterMap] ⚠️ 未找到城市代码:', cityName)
      isMapTransitioning.value = false
      return
    }

    console.log(`[PestCenterMap] 🗺️ 正在加载 ${cityName} 地图数据...`)

    // 从阿里 DataV 获取市级 GeoJSON
    const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${cityCode}_full.json`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法加载 ${cityName} 地图数据`)
    }

    const cityGeoJson = await response.json()

    // 注册市级地图
    echarts.registerMap('currentCity', cityGeoJson as any)

    // 切换到市级地图
    currentMapLevel.value = 'city'

    // 动画过渡到市级地图
    chartInstance.setOption({
      geo: {
        map: 'currentCity',
        roam: true,
        zoom: 1.2,
        center: undefined,
        label: {
          show: true,
          fontSize: 11,
          color: '#d4a574',
          fontWeight: 500
        },
        itemStyle: {
          areaColor: '#3d2415',
          borderColor: '#6b4423',
          borderWidth: 1.5,
          shadowColor: 'rgba(212, 136, 6, 0.15)',
          shadowBlur: 8
        },
        emphasis: {
          label: {
            color: '#fbbf24',
            fontSize: 13,
            fontWeight: 700
          },
          itemStyle: {
            areaColor: '#4a2c18',
            borderColor: '#d48806',
            borderWidth: 2,
            shadowColor: 'rgba(212, 136, 6, 0.4)',
            shadowBlur: 20
          }
        }
      },
      series: []
    }, true)

    console.log(`[PestCenterMap] ✅ 成功切换到 ${cityName} 地图`)

  } catch (error) {
    console.error('[PestCenterMap] ❌ 切换城市地图失败:', error)
    // 回退到上一级
    backToPreviousLevel()
  } finally {
    setTimeout(() => {
      isMapTransitioning.value = false
    }, 300)
  }
}

/**
 * 点击区县时跳转到县级地图（新增）
 */
async function zoomToCounty(countyName: string) {
  console.log(`[PestCenterMap] 🎯 开始加载县级地图: ${countyName}`)

  if (!chartInstance) {
    console.error('[PestCenterMap] ❌ chartInstance 不存在')
    return
  }

  if (isMapTransitioning.value) {
    console.warn('[PestCenterMap] ⚠️ 地图正在切换中，请稍候...')
    return
  }

  isMapTransitioning.value = true

  // 保存当前状态到历史栈
  mapHistoryStack.value.push({
    level: 'city',
    cityName: currentCityName.value,
    countyName: undefined
  })

  currentCountyName.value = countyName

  try {
    const cityCode = cityCodeMap[currentCityName.value]
    if (!cityCode) {
      throw new Error(`未找到城市代码: ${currentCityName.value}`)
    }

    console.log(`[PestCenterMap] 📡 正在从阿里 DataV 获取 ${currentCityName.value} 的 GeoJSON... (城市代码: ${cityCode})`)

    // 从阿里 DataV 获取包含所有区县的市级 GeoJSON
    const response = await fetch(
      `https://geo.datav.aliyun.com/areas_v3/bound/${cityCode}_full.json`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法加载 ${countyName} 地图数据`)
    }

    const cityGeoJson = await response.json()
    console.log(`[PestCenterMap] ✅ 成功获取 ${currentCityName.value} GeoJSON，共 ${cityGeoJson.features.length} 个区域`)

    // 查找对应的区县 feature（模糊匹配）
    let countyFeature = cityGeoJson.features.find(
      (feature: any) => feature.properties.name === countyName
    )

    // 如果精确匹配失败，尝试模糊匹配（处理"市辖区"、"历下区"等情况）
    if (!countyFeature) {
      countyFeature = cityGeoJson.features.find(
        (feature: any) =>
          feature.properties.name?.includes(countyName) ||
          countyName.includes(feature.properties.name)
      )
      console.log(`[PestCenterMap] 🔍 精确匹配失败，尝试模糊匹配...`)
    }

    // 如果还是找不到，列出所有可用的区县名称帮助调试
    if (!countyFeature) {
      const availableCounties = cityGeoJson.features.map((f: any) => f.properties.name)
      console.warn(`[PestCenterMap] ⚠️ 未找到 "${countyName}" 的地理数据`)
      console.log('[PestCenterMap] 💡 可用的区县列表:', availableCounties.join(', '))
      throw new Error(`未找到区县 "${countyName}"，请检查名称是否正确`)
    }

    console.log(`[PestCenterMap] ✅ 找到区县: ${countyFeature.properties.name}`)

    // 创建只包含该区县的 GeoJSON
    const countyGeoJson = {
      type: 'FeatureCollection',
      features: [countyFeature]
    }

    // 注册县级地图（使用唯一标识符避免冲突）
    const mapId = `county_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    echarts.registerMap(mapId, countyGeoJson as any)

    // 切换到县级地图
    currentMapLevel.value = 'county'

    console.log(`[PestCenterMap] 🗺️ 正在渲染县级地图 (${mapId})...`)

    // 更新地图配置为县级视图（虫害专题风格：深棕色主题 + 金色高亮）
    chartInstance.setOption({
      geo: {
        map: mapId,
        roam: true,
        zoom: 1.5,           // 县级地图放大更多以查看细节
        center: undefined,   // 自动居中
        label: {
          show: true,
          fontSize: 14,         // 县级标签更大
          color: '#ffffff',
          fontWeight: 700,
          textShadowColor: 'rgba(0, 0, 0, 1)',
          textShadowBlur: 4,
          textShadowOffsetX: 1,
          textShadowOffsetY: 1
        },
        emphasis: {
          label: {
            show: true,
            color: '#fbbf24',
            fontSize: 16,
            fontWeight: 800,
            textShadowColor: 'rgba(0, 0, 0, 1)',
            textShadowBlur: 6,
            textShadowOffsetX: 1,
            textShadowOffsetY: 1
          },
          itemStyle: {
            areaColor: '#8b5a2b',   // 虫害专题风格：深棕色高亮
            shadowColor: 'rgba(212, 136, 6, 0.6)',
            shadowBlur: 25,
            borderWidth: 3,
            borderColor: '#d48806'
          }
        },
        itemStyle: {
          areaColor: 'rgba(61, 36, 21, 0.85)',  // 深棕色半透明背景
          borderColor: 'rgba(107, 68, 35, 0.8)',   // 棕色边框
          borderWidth: 2
        },
        silent: false  // 确保可以点击和交互
      },
      series: []  // 县级地图暂不显示散点数据（后续可扩展虫害监测点）
    }, true)

    console.log(`[PestCenterMap] ✅✅✅ 成功切换到 ${countyName} 县级地图！`)

  } catch (error) {
    console.error('[PestCenterMap] ❌ 切换县级地图失败:', error)

    // 显示错误提示
    alert(`无法加载 ${countyName} 的地图数据，将返回上一级\n错误信息: ${error instanceof Error ? error.message : String(error)}`)

    // 回退到上一级
    backToPreviousLevel()
  } finally {
    setTimeout(() => {
      isMapTransitioning.value = false
      console.log('[PestCenterMap] 🔓 解除锁定状态')
    }, 500)  // 延长锁定时间确保动画完成
  }
}

/**
 * 返回上一级地图（通用 - 支持多级返回）⭐ 新增
 */
function backToPreviousLevel() {
  if (!chartInstance || isMapTransitioning.value) return

  isMapTransitioning.value = true

  const previousState = mapHistoryStack.value.pop()

  if (!previousState) {
    // 没有历史记录，重置到省级地图
    resetToProvince()
    return
  }

  console.log(`[PestCenterMap] 🔙 返回上一级: ${currentMapLevel.value} → ${previousState.level}`)

  // 根据上一级状态恢复地图
  switch (previousState.level) {
    case 'province':
      resetToProvince()
      break

    case 'city':
      // 返回到市级地图
      currentMapLevel.value = 'city'
      currentCountyName.value = ''
      showCityPopup.value = false
      // 重新加载市级地图
      zoomToCity(previousState.cityName, [117.0, 36.65]).finally(() => {
        setTimeout(() => {
          isMapTransitioning.value = false
        }, 300)
      })
      return  // 提前返回，避免重复设置 timeout

    default:
      resetToProvince()
  }

  setTimeout(() => {
    isMapTransitioning.value = false
  }, 300)
}

/**
 * 重置到省级地图（根级返回）
 */
function resetToProvince() {
  if (!chartInstance) return

  // 清空所有状态
  currentMapLevel.value = 'province'
  currentCityName.value = ''
  currentCountyName.value = ''
  mapHistoryStack.value = []
  showCityPopup.value = false

  // 重新设置省级地图配置
  updateChartOption()

  console.log('[PestCenterMap] 🔙 重置到省级地图')
}

// 兼容旧接口：backToProvince 直接调用 resetToProvince
const backToProvince = resetToProvince

function showCityDetailPopup(city: CityBubble, params: any) {
  selectedCityData.value = {
    fullName: `${city.name}历下区${pestTabs.find(t => t.key === activePestTab.value)?.label || '虫'}灯诱`,
    isOffline: Math.random() > 0.5,
    peakValue: `${Math.floor(Math.random() * 10)}#${Math.floor(Math.random() * 365)}天`,
    monitorTime: `2023.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }
  showCityPopup.value = true
  if (params.event?.event) {
    popupPosition.value = {
      top: params.event.event.offsetY + 10 + 'px',
      left: params.event.event.offsetX + 10 + 'px'
    }
  }
}

function updateChartOption() {
  if (!chartInstance) return

  const bubbles = currentCityBubbles.value
  if (bubbles.length === 0) return

  const maxVal = Math.max(...bubbles.map(b => b.value))

  chartInstance.setOption({
    backgroundColor: 'transparent',
    geo: {
      map: 'shandong',
      roam: false,
      zoom: 1.15,
      center: [118.0, 36.6],
      label: {
        show: true,
        fontSize: 11,
        color: '#d4a574',
        fontWeight: 500
      },
      itemStyle: {
        areaColor: '#3d2415',
        borderColor: '#6b4423',
        borderWidth: 1.5,
        shadowColor: 'rgba(212, 136, 6, 0.15)',
        shadowBlur: 8
      },
      emphasis: {
        label: {
          color: '#fbbf24',
          fontSize: 13,
          fontWeight: 700
        },
        itemStyle: {
          areaColor: '#4a2c18',
          borderColor: '#d48806',
          borderWidth: 2,
          shadowColor: 'rgba(212, 136, 6, 0.4)',
          shadowBlur: 20
        }
      }
    },
    series: [{
      type: 'scatter',
      coordinateSystem: 'geo',
      data: bubbles.map(city => ({
        name: city.name,
        value: [...city.coord, city.value]
      })),
      symbolSize: (val: number[]) => getBubbleSize(val[2]),
      itemStyle: {
        color: (params: any) => getBubbleColor(params.data?.value[2] || 0),
        opacity: 0.9,
        shadowBlur: 15,
        shadowColor: (params: any) => `${getBubbleColor(params.data?.value[2] || 0)}80`,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)'
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          const val = params.data?.value[2] || 0
          return `{value|${val}}`
        },
        rich: {
          value: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
            padding: [2, 8],
            align: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 10,
            lineHeight: 22
          }
        },
        emphasis: {
          show: true
        }
      },
      emphasis: {
        scale: 1.3,
        itemStyle: {
          shadowBlur: 25,
          shadowColor: (params: any) => `${getBubbleColor(params.data?.value[2] || 0)}cc`
        }
      },
      zlevel: 5
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(42, 24, 16, 0.96)',
      borderColor: 'rgba(212, 136, 6, 0.4)',
      borderWidth: 1.5,
      borderRadius: 8,
      padding: [12, 16],
      textStyle: {
        color: '#e2e8f0',
        fontSize: 13
      },
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
      formatter: (params: any) => {
        return `<strong style="color:#fbbf24">${params.name}</strong><br/>灯诱虫量: <span style="color:#e6a23c;font-weight:700">${params.data?.value[2] || 0}</span>`
      }
    }
  })
}

function handleResize() {
  chartInstance?.resize()
}

watch([activePestTab, selectedDate, activeLightTrap], () => {
  updateChartOption()
})

onMounted(() => {
  initMap()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  chartInstance?.dispose()
})

function handleKeyDown(event: KeyboardEvent) {
  // ESC 键返回上一级地图（支持多级）
  if (event.key === 'Escape' && currentMapLevel.value !== 'province') {
    backToPreviousLevel()
  }
}
</script>

<style scoped>
.pest-center-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #2a1810;
  border-radius: 8px;
}

.pcm-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  gap: 10px;
}

/* ===== 主体布局：左侧栏 + 中央区域 ===== */
.pcm-body {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow: hidden;
}

.pcm-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pcm-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 8px;
}

.pcm-tab {
  padding: 8px 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #a0826d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pcm-tab:hover {
  color: #d4a574;
  background: rgba(212, 136, 6, 0.1);
}

.pcm-tab--active {
  background: linear-gradient(135deg, #d48806, #e6a23c);
  color: #fff;
  box-shadow: 0 4px 12px rgba(212, 136, 6, 0.3);
}

.pcm-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(58, 32, 18, 0.8), rgba(42, 24, 16, 0.6));
  border: 1px solid rgba(212, 136, 6, 0.2);
  border-radius: 8px;
}

.pcm-title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== 面包屑导航 ===== */

.breadcrumb-nav,
.breadcrumb-nav-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(212, 136, 6, 0.15);
}

.breadcrumb-item {
  font-size: 13px;
  color: #a0826d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 2px 6px;
  border-radius: 4px;
}

.breadcrumb-item--active:hover {
  color: #d48806;
  background: rgba(212, 136, 6, 0.1);
}

.breadcrumb-item--current {
  color: #fbbf24;
  font-weight: 700;
  cursor: default;
}

.breadcrumb-separator {
  color: #6b4423;
  font-weight: 600;
  font-size: 14px;
}

/* ===== 虫害专题面包屑导航样式 ===== */

.breadcrumb-nav-pest {
  position: absolute;
  top: 16px;
  left: 180px; /* 在返回按钮右侧 */
  z-index: 19;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.95), rgba(58, 32, 18, 0.92));
  border: 1px solid rgba(212, 136, 6, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.breadcrumb-nav-pest .breadcrumb-item {
  font-size: 13px;
  color: #a0826d;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: default;
  white-space: nowrap;
}

.breadcrumb-nav-pest .breadcrumb-item--clickable {
  color: #d4a574;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.breadcrumb-nav-pest .breadcrumb-item--clickable:hover {
  color: #fbbf24;
  background: rgba(212, 136, 6, 0.15);
}

.breadcrumb-nav-pest .breadcrumb-item--current {
  color: #fbbf24;
  font-weight: 700;
  font-size: 14px;
}

.breadcrumb-nav-pest .breadcrumb-separator {
  color: #8b5a2b;
  font-weight: 600;
  font-size: 14px;
  user-select: none;
}

/* 操作提示（虫害专题风格） */
.breadcrumb-hint-pest {
  margin-left: 12px;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(212, 136, 6, 0.2), rgba(230, 162, 60, 0.15));
  border: 1px solid rgba(212, 136, 6, 0.35);
  border-radius: 12px;
  font-size: 11px;
  color: #fbbf24;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.15), inset 0 0 8px rgba(245, 158, 11, 0.05);
}

/* 面包屑过渡动画 */
.breadcrumb-fade-enter-active,
.breadcrumb-fade-leave-active {
  transition: all 0.3s ease;
}

.breadcrumb-fade-enter-from,
.breadcrumb-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.pcm-calendar-icon {
  font-size: 18px;
}

.pcm-year-select {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 136, 6, 0.3);
  border-radius: 4px;
  color: #e6a23c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.pcm-year-select option {
  background: #2a1810;
  color: #e6a23c;
}

.pcm-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: 1px;
}

.pcm-date-range {
  font-size: 13px;
  color: #a0826d;
  font-weight: 500;
}

.pcm-timeline {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 4px;
  scrollbar-width: thin;
  scrollbar-color: #6b4423 transparent;
}

.pcm-timeline::-webkit-scrollbar {
  height: 4px;
}

.pcm-timeline::-webkit-scrollbar-thumb {
  background: #6b4423;
  border-radius: 2px;
}

.pcm-timeline-item {
  flex-shrink: 0;
  min-width: 50px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 136, 6, 0.2);
  border-radius: 6px;
  color: #a0826d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.pcm-timeline-item:hover {
  background: rgba(212, 136, 6, 0.15);
  border-color: rgba(212, 136, 6, 0.4);
  color: #d4a574;
  transform: translateY(-2px);
}

.pcm-timeline-item--active {
  background: linear-gradient(135deg, #d48806, #e6a23c);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(212, 136, 6, 0.4);
  transform: translateY(-2px);
}

.pcm-timeline-arrow {
  color: #6b4423;
  font-size: 14px;
  font-weight: bold;
}

.pcm-map-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  gap: 12px;
  overflow: hidden;
}

/* ===== 返回按钮（市级地图时显示） ===== */

.pcm-back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(212, 136, 6, 0.9), rgba(230, 162, 60, 0.85));
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(212, 136, 6, 0.4),
    0 0 20px rgba(212, 136, 6, 0.15);
  backdrop-filter: blur(8px);
}

.pcm-back-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.95), rgba(245, 180, 80, 0.9));
  box-shadow:
    0 8px 24px rgba(212, 136, 6, 0.5),
    0 0 30px rgba(212, 136, 6, 0.2);
}

.pcm-back-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.pcm-back-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-icon {
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.back-text {
  letter-spacing: 0.5px;
}

/* 返回按钮过渡动画 */
.back-btn-fade-enter-active,
.back-btn-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.back-btn-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ===== 地图加载状态 ===== */

.pcm-map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.95), rgba(58, 32, 18, 0.92));
  z-index: 40;
  backdrop-filter: blur(12px);
  border-radius: 8px;
}

.pcm-map-loading .loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(212, 136, 6, 0.2);
  border-top-color: #d48806;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pcm-map-loading span {
  color: #d4a574;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pcm-map-container {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.pcm-city-popup {
  position: absolute;
  min-width: 260px;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.98), rgba(58, 32, 18, 0.96));
  border: 1px solid rgba(212, 136, 6, 0.4);
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(212, 136, 6, 0.15);
  z-index: 100;
  overflow: hidden;
  animation: popupIn 0.3s ease-out;
}

@keyframes popupIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.pcm-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(212, 136, 6, 0.2), rgba(230, 162, 60, 0.15));
  border-bottom: 1px solid rgba(212, 136, 6, 0.25);
}

.pcm-popup-title {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.pcm-popup-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.pcm-popup-close:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(1.1);
}

.pcm-popup-body {
  padding: 14px 16px;
}

.pcm-popup-status {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  color: #10b981;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.pcm-popup-status--offline {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.pcm-popup-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(212, 136, 6, 0.1);
}

.pcm-popup-row:last-child {
  border-bottom: none;
}

.pcm-popup-label {
  font-size: 12px;
  color: #a0826d;
}

.pcm-popup-value {
  font-size: 13px;
  font-weight: 600;
  color: #e6a23c;
}

.pcm-popup-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(212, 136, 6, 0.15);
}

.pcm-popup-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(212, 136, 6, 0.1);
  border: 1px solid rgba(212, 136, 6, 0.25);
  border-radius: 6px;
  color: #d4a574;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pcm-popup-btn:hover {
  background: rgba(212, 136, 6, 0.2);
  border-color: rgba(212, 136, 6, 0.45);
  transform: translateY(-2px);
}

.pcm-popup-btn--compare:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
}

.pcm-popup-btn--select:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  color: #34d399;
}

.pcm-popup-btn--more:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
  color: #a78bfa;
}

.pcm-right-panel {
  width: 140px;
  flex-shrink: 0;
  padding: 16px 12px;
  background: linear-gradient(180deg, rgba(58, 32, 18, 0.9), rgba(42, 24, 16, 0.85));
  border: 1px solid rgba(212, 136, 6, 0.25);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pcm-panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 136, 6, 0.2);
}

.pcm-panel-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pcm-radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 136, 6, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pcm-radio-item:hover {
  background: rgba(212, 136, 6, 0.1);
  border-color: rgba(212, 136, 6, 0.3);
}

.pcm-radio-item--active {
  background: rgba(212, 136, 6, 0.15);
  border-color: #d48806;
  box-shadow: 0 0 10px rgba(212, 136, 6, 0.2);
}

.pcm-radio-input {
  display: none;
}

.pcm-radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #6b4423;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.pcm-radio-item--active .pcm-radio-custom {
  border-color: #e6a23c;
}

.pcm-radio-item--active .pcm-radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #e6a23c;
  border-radius: 50%;
}

.pcm-radio-label {
  font-size: 13px;
  color: #d4a574;
  font-weight: 500;
}

.pcm-radio-item--active .pcm-radio-label {
  color: #fbbf24;
  font-weight: 600;
}

.pcm-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0 4px;
}

.pcm-footer-tabs {
  display: flex;
  gap: 4px;
}

.pcm-footer-tab {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid rgba(212, 136, 6, 0.2);
  border-radius: 16px;
  color: #a0826d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pcm-footer-tab:hover {
  background: rgba(212, 136, 6, 0.1);
  border-color: rgba(212, 136, 6, 0.35);
  color: #d4a574;
}

.pcm-footer-tab--active {
  background: linear-gradient(135deg, #d48806, #e6a23c);
  border-color: transparent;
  color: #fff;
}

.pcm-legend-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.pcm-legend-gradient {
  flex: 1;
  height: 12px;
  background: linear-gradient(90deg, #d48806, #e6a23c, #f59e0b, #fbbf24, #ef4444);
  border-radius: 6px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pcm-legend-labels {
  display: flex;
  justify-content: space-between;
  min-width: 120px;
  font-size: 11px;
  color: #a0826d;
  font-weight: 500;
}

.pcm-compare-info {
  font-size: 13px;
  color: #e6a23c;
  font-weight: 600;
  white-space: nowrap;
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: all 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 中央区域 */
.pcm-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
