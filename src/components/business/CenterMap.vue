<template>
  <div class="center-map" :class="{ 'center-map--loading': isLoading, 'center-map--station': isDistributionMode }">
    <!-- GeoJSON 加载状态提示 -->
    <div v-if="!geojsonData" class="geojson-loading">
      <div class="loading-spinner-large"></div>
      <p class="loading-text">正在加载山东省地图数据...</p>
    </div>

    <!-- 返回上级地图按钮（市级或县级地图时显示） -->
    <Transition name="back-btn-fade">
      <button
        v-if="currentMapLevel !== 'province'"
        class="back-to-province-btn"
        @click="backToPreviousLevel"
        :disabled="isMapTransitioning"
      >
        <span class="back-btn-icon">←</span>
        <span class="back-btn-text">{{ backButtonText }}</span>
      </button>
    </Transition>

    <!-- 面包屑导航（显示当前地图层级路径） -->
    <Transition name="breadcrumb-fade">
      <div
        v-if="currentMapLevel !== 'province'"
        class="breadcrumb-navigation"
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
        <span v-if="currentMapLevel === 'city'" class="breadcrumb-hint">
          👆 点击区县可查看详情
        </span>
      </div>
    </Transition>

    <!-- 加载状态提示（切换城市时显示） -->
    <Transition name="loading-fade">
      <div v-if="isMapTransitioning" class="city-loading-overlay">
        <div class="loading-spinner-large"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </Transition>

    <!-- ECharts 容器：仅在 GeoJSON 加载完成后渲染，避免 "Map not exists" 错误 -->
    <EChartsWrapper
      v-if="geojsonData"
      ref="echartsRef"
      :option="chartOption"
      :not-merge="true"
      :auto-resize="true"
      :loading="isLoading || isMapLoading"
      loading-text="渲染地图..."
      @ready="onChartReady"
      @mouseout="onChartLeave"
      @resize="onChartResize"
      @error="onChartError"
    >
      <!-- 自定义覆盖层：工具栏 -->
      <template #overlay>
        <!-- 地图工具栏 -->
        <div class="map-toolbar" v-if="showToolbar && !isLoading">
          <button
            v-for="tool in toolbarTools"
            :key="tool.key"
            :class="['tool-btn', { 'tool-btn--active': activeTool === tool.key }]"
            @click="handleToolClick(tool.key)"
            :title="tool.label"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
          </button>

          <!-- 分隔线 -->
          <div class="toolbar-divider"></div>

          <!-- 地图模式切换按钮 -->
          <button
            v-for="mode in mapModeTools"
            :key="mode.key"
            :class="['tool-btn', 'mode-switch-btn', { 'mode-switch-btn--active': currentMapMode === mode.key }]"
            @click="switchMapMode(mode.key)"
            :title="mode.label"
          >
            <span class="tool-icon">{{ mode.icon }}</span>
            <span class="mode-label">{{ mode.label }}</span>
          </button>
        </div>

        <!-- 地图标题 -->
        <div class="map-title" v-if="mapTitle">
          {{ mapTitle }}
        </div>

        <!-- ★ 轮播统计面板（浮动在当前轮播城市的地图坐标位置） -->
        <Transition name="stats-panel-move">
          <div
            class="map-stats-panel map-stats-panel--floating"
            v-if="showLegend && statsCarouselCity && currentMapMode !== 'heatmap'"
            :style="{
              left: statsPanelPos.x + 'px',
              top: statsPanelPos.y + 'px'
            }"
          >
            <div class="stats-panel-title">
              <span class="stats-panel-city-name">{{ statsCarouselCity.name }}</span>
              <span class="stats-panel-dots">
                <span
                  v-for="(c, i) in statsCarouselCities"
                  :key="c.name"
                  :class="['stats-dot-indicator', { 'stats-dot-indicator--active': i === statsCarouselIndex }]"
                ></span>
              </span>
            </div>
            <div v-for="(stat, idx) in statsCarouselData" :key="'stat-' + idx" class="stats-row">
              <span class="stats-dot" :style="{ background: stat.color }"></span>
              <span class="stats-label">{{ stat.label }}:</span>
              <span class="stats-value" :style="{ color: stat.color }">{{ stat.value }}</span>
            </div>
            <!-- 指向城市的小箭头 -->
            <div class="stats-panel-arrow"></div>
          </div>
        </Transition>

        <!-- 图例（原型风格：4级色阶 + 垂直渐变条） -->
        <div
          v-if="showLegend"
          class="map-legend map-legend--proto"
        >
          <div class="proto-legend-bar-wrap">
            <div class="proto-legend-colors">
              <span class="proto-color-block proto-color--orange"></span>
              <span class="proto-color-block proto-color--yellow"></span>
              <span class="proto-color-block proto-color--green"></span>
              <span class="proto-color-block proto-color--blue"></span>
            </div>
          </div>
          <div class="proto-legend-labels">
            <span>50以上</span>
            <span>30-50</span>
            <span>15-30</span>
            <span>15以下</span>
          </div>
        </div>

        <!-- 底部操作按钮组（原型：重点市县 / 空间分布） -->

        <!-- （轮播功能已删除） -->

        <!-- 城市信息提示框（悬停时显示，站点模式隐藏） -->
        <Transition name="tooltip-fade">
          <div
            v-if="hoveredCityInfo && !isDistributionMode"
            class="city-tooltip"
            :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
          >
            <div class="tooltip-header">
              <span class="tooltip-city-name">{{ hoveredCityInfo.name }}</span>
              <span class="tooltip-close" @click="closeTooltip">×</span>
            </div>
            <div class="tooltip-body">
              <div class="tooltip-row">
                <span class="tooltip-label">监测值</span>
                <span class="tooltip-value" style="color: #fbbf24">
                  {{ hoveredCityInfo.value }}
                </span>
              </div>
              <div class="tooltip-row" v-if="hoveredCityInfo.rank !== undefined">
                <span class="tooltip-label">排名</span>
                <span class="tooltip-value" style="color: #10b981">
                  第{{ hoveredCityInfo.rank }}名
                </span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 缩放控制按钮 -->
        <div class="zoom-controls" v-if="showZoomControls">
          <button class="zoom-btn zoom-in" @click="zoomIn" title="放大">+</button>
          <button class="zoom-btn zoom-out" @click="zoomOut" title="缩小">−</button>
          <button class="zoom-btn zoom-reset" @click="resetZoom" title="重置">⌂</button>
        </div>
      </template>
    </EChartsWrapper>

    <!-- ★ 站点/设备模式：点击弹窗（自定义HTML，替代ECharts tooltip） -->
    <Transition name="station-tip-fade">
      <div
        v-if="stationTipVisible"
        class="station-click-tip"
        :style="{ left: stationTipPos.x + 'px', top: stationTipPos.y + 'px' }"
        @click.stop
      >
        <div class="sct-title">{{ stationTipType === 'device' ? '设备' : stationTipType === 'offline' ? '离线' : stationTipType === 'lightTrap' ? '灯诱' : stationTipType === 'sexTrap' ? '性诱' : stationTipType === 'habitat' ? '生境' : '站点' }}</div>
        <div class="sct-row">
          <span class="sct-dot">●</span>
          <span class="sct-label">设备名称：</span>
          <span class="sct-val">{{ stationTipName }}</span>
        </div>
        <button class="sct-close" @click.stop="stationTipVisible = false">×</button>
      </div>
    </Transition>

    <!-- 底部操作按钮组（原型：重点市县 / 空间分布） -->
    <div class="map-actions" v-if="showActions && !isLoading">
      <button
        v-for="action in actionButtons"
        :key="action"
        :class="['action-btn', { 'action-btn--active': activeAction === action }]"
        @click="handleAction(action)"
      >{{ action }}</button>
    </div>

    <!-- 交互提示（引导用户单击下钻） -->
    <Transition name="hint-fade">
      <div class="map-interaction-hint" v-if="showInteractionHint && !isLoading">
        <span class="hint-icon">🖱️</span>
        <span class="hint-text">单击区域进入下一级地图</span>
      </div>
    </Transition>

    <!-- 错误提示 toast -->
    <Transition name="hint-fade">
      <div v-if="toastMessage" class="map-toast">
        <span class="toast-icon">⚠️</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from '@/utils/echarts'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { getLevelColor } from '@/composables/usePestDensityLevel'

// ============================================
// 类型定义
// ============================================

interface CityData {
  name: string
  value: number
  lng?: number
  lat?: number
  rank?: number
}

interface MapMarker {
  name: string
  coord: [number, number]
  value: number
  city?: string
}

// ============================================
// ★ 共享常量
// ============================================

/** 山东省16市 经纬度坐标映射表 */
const CITY_COORDS: Record<string, [number, number]> = {
  '济南市': [117.0, 36.65], '青岛市': [120.38, 36.07], '烟台市': [121.39, 37.54],
  '潍坊市': [119.11, 36.71], '临沂市': [118.35, 35.05], '淄博市': [118.04, 36.81],
  '济宁市': [116.58, 35.41], '泰安市': [117.12, 36.19], '威海市': [122.12, 37.51],
  '德州市': [116.30, 37.45], '聊城市': [115.98, 36.46], '滨州市': [117.97, 37.38],
  '菏泽市': [115.47, 35.24], '枣庄市': [117.55, 34.86], '日照市': [119.53, 35.42],
  '东营市': [118.49, 37.46]
}

/** 绿色主题（站点/离线/灯诱/性诱/生境共用） */
const GREEN_THEME = {
  itemStyle: {
    color: '#10b981' as const,
    borderColor: '#34d399' as const,
    shadowColor: 'rgba(16,185,129,.50)' as const,
    opacity: 0.95 as const
  },
  label: {
    show: true as const,
    position: 'top' as const,
    fontSize: 11 as const,
    color: '#a7f3d0' as const,
    fontWeight: 500 as const,
    textShadowColor: 'rgba(0,0,0,0.8)' as const,
    textShadowBlur: 4 as const,
    formatter: '{b}' as const
  },
  emphasis: {
    scale: 1.4 as const,
    itemStyle: {
      color: '#34d399' as const,
      shadowBlur: 22 as const,
      shadowColor: 'rgba(52,211,153,.70)' as const
    }
  }
}

/** 基于城市名确定性生成 6位 hex 设备ID */
function calcCityHash(cityName: string, length = 6): string {
  const hash = cityName.split('').reduce((a: number, c: string) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  return Math.abs(hash).toString(16).slice(0, length).padStart(length, '0')
}

// ============================================
// Props 定义
// ============================================

interface Props {
  /** 城市/区域数据 */
  citiesData?: CityData[]
  /** 散点标记数据 */
  markers?: MapMarker[]
  /** GeoJSON 文件路径 */
  geoJsonUrl?: string
  /** 地图模式 */
  mapMode?: 'heatmap' | 'scatter' | 'effectScatter' | 'choropleth' | 'gis' | 'station'
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示图例 */
  showLegend?: boolean
  /** 是否显示缩放控制 */
  showZoomControls?: boolean
  /** 是否显示底部操作按钮 */
  showActions?: boolean
  /** 是否显示交互提示（单击/双击引导） */
  showInteractionHint?: boolean
  /** 地图标题 */
  mapTitle?: string
  /** 主题色 */
  themeColor?: string
  /** 高度 */
  height?: string
  /** 选中的城市名称 */
  selectedCity?: string
  /** 热力图配置 */
  heatmapConfig?: {
    min?: number
    max?: number
    radius?: number
    blurSize?: number
  }
  /** 是否显示虫害监测散点（从 /api/points 加载） */
  showPestScatter?: boolean
  /** 虫害点位 API 地址 */
  pestScatterApiUrl?: string
  /** 虫种颜色配置（按虫种key映射颜色，用于散点图气泡配色） */
  pestColorConfig?: {
    color: string       // 基础色（低值）
    colorHigh: string   // 高亮色（高值）
    colorMid: string    // 中间色
  }
  /** GIS 模式 - 站点监测点数据（用于 effectScatter 涟漪标记） */
  gisStationMarkers?: Array<{ name: string; coord: [number, number]; value: number; level: number }>
  /** GIS 模式 - 热力图密集点数据（用于 heatmap 层） */
  gisHeatmapPoints?: Array<{ name: string; coord: [number, number]; value: number }>
  /** 是否显示城市轮播栏 */
  showCarousel?: boolean
  /** 轮播间隔（毫秒） */
  carouselInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  citiesData: () => [],
  markers: () => [],
  geoJsonUrl: '/geoJson/shandong.geojson',
  mapMode: 'choropleth',
  showToolbar: true,
  showLegend: true,
  showZoomControls: true,
  showActions: true,
  showInteractionHint: true,
  mapTitle: '',
  themeColor: '#f59e0b',
  height: '450px',
  selectedCity: '',
  heatmapConfig: () => ({
    min: 0,
    max: 100,
    radius: 20,
    blurSize: 30
  }),
  showPestScatter: true,        // 默认显示虫害散点
  pestScatterApiUrl: '/api/points', // 虫害点位 API
  pestColorConfig: () => ({       // 默认橙色系（与虫害专题粮棉虫一致）
    color: '#f59e0b',
    colorHigh: '#ef4444',
    colorMid: '#ef4444'
  }),
  showCarousel: true,              // 默认显示城市轮播
  carouselInterval: 3000           // 默认轮播间隔 3 秒
})

// ============================================
// Emits 定义
// ============================================

const emit = defineEmits<{
  (e: 'city-click', data: CityData & { event: any }): void
  (e: 'city-hover', data: CityData): void
  (e: 'city-leave'): void
  (e: 'map-ready', chart: echarts.ECharts): void
  (e: 'action', actionName: string): void
  (e: 'geojson-loaded', data: GeoJSON.GeoJSON): void
  (e: 'pest-scatter-loaded', points: any[], summary: any): void
  (e: 'station-click', data: { name: string; value: any; event: any }): void
  (e: 'error', error: Error): void
  (e: 'map-level-change', level: 'province' | 'city' | 'county', cityName?: string, countyName?: string): void
}>()

// ============================================
// 响应式状态
// ============================================

const echartsRef = ref<InstanceType<typeof EChartsWrapper> | null>(null)
let chartInstance: echarts.ECharts | null = null

// ============================================
// ★ 点击交互引擎：单击=下钻
// ============================================

/** 上次点击目标（用于防抖） */
let _lastClickTarget = ''
/** 上次点击时间 */
let _lastClickTime = 0
const isLoading = ref(true)
const isMapLoading = ref(false)
const error = ref<Error | null>(null)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

/** 显示 toast 通知（3秒后自动消失） */
function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 3000)
}
const activeTool = ref('select')
const hoveredCityInfo = ref<CityData | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const geojsonData = ref<any>(null)
const activeAction = ref<string>('重点区市')
// 交互提示显示状态（受 prop 控制，用户操作后可自动隐藏）
const _hintVisible = ref(props.showInteractionHint)
const showInteractionHint = computed({
  get: () => props.showInteractionHint && _hintVisible.value,
  set: (val: boolean) => { _hintVisible.value = val }
})

// ★ 站点/设备模式：点击弹窗状态
const stationTipVisible = ref(false)
const stationTipPos = ref({ x: 0, y: 0 })
const stationTipName = ref('')
const stationTipType = ref<'station' | 'device' | 'offline' | 'lightTrap' | 'sexTrap' | 'habitat'>('station')

// 地图级别管理（新增 - 支持三级下钻：省→市→县）
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

// 下钻后的散点数据（解决 chartOption computed 覆盖问题）
const drillDownScatterData = ref<any[]>([])
// 下钻后的 geo 地图名称（解决 chartOption computed 中 map 硬编码问题）
const currentGeoMapName = ref<string>('shandong')
// 是否处于下钻模式（切换 option 绑定源，彻底隔离省级数据）
const isDrilledDown = ref(false)

// 虫害监测散点数据（从 /api/points 获取）
const pestScatterData = ref<any[]>([])
const isPestScatterLoading = ref(false)

// 工具栏配置
const toolbarTools = [
  { key: 'select', label: '选择', icon: '🖱️' },
  { key: 'zoomIn', label: '放大', icon: '➕' },
  { key: 'zoomOut', label: '缩小', icon: '➖' },
  { key: 'restore', label: '重置', icon: '🔄' }
]

// 地图模式切换按钮
const mapModeTools = [
  { key: 'station', label: '站点', icon: '�' },
  { key: 'scatter', label: '散点图', icon: '�' },
  { key: 'gis', label: 'GIS', icon: '🗺️' }
]

// 当前地图模式（可切换）
const currentMapMode = ref(props.mapMode)

/** 分布模式集合（站点/设备/离线/灯诱/性诱/生境） */
const DISTRIBUTION_MODES = ['station', 'device', 'offline', 'lightTrap', 'sexTrap', 'habitat'] as const
const isDistributionMode = computed(() => DISTRIBUTION_MODES.includes(currentMapMode.value as any))

// 操作按钮列表
const actionButtons = computed(() => ['重点区市', '空间分布'])

/** 右上角统计数据（原型：发生面积/防治面积/监测点数/平均危害率） */
const mapStatsData = computed(() => {
  const cities = props.citiesData || []
  const totalValue = cities.reduce((s, c) => s + (c.value || 0), 0)
  const count = cities.length || 11
  return [
    { label: '发生面积', value: (totalValue * 4.2).toFixed(0) + '亩', color: '#fbbf24' },
    { label: '防治面积', value: (totalValue * 5.3).toFixed(0) + '亩', color: '#2F6F9F' },
    { label: '监测点数', value: count + '个',          color: '#34d399' },
    { label: '平均危害率', value: ((totalValue / Math.max(count, 1)) % 15 + 5).toFixed(0) + '%', color: '#f87171' }
  ]
})

// ============================================
// ★ 统计面板城市轮播（自动轮播每个城市的 mapStatsData）
// ============================================
const statsCarouselIndex = ref(0)
let statsCarouselTimer: ReturnType<typeof setInterval> | null = null

/** 轮播面板的像素坐标位置（浮动在城市上方） */
const statsPanelPos = ref({ x: 300, y: 100 })

/** 轮播城市列表 */
const statsCarouselCities = computed(() => {
  const cities = props.citiesData || []
  if (cities.length > 0) return cities
  // 无数据时使用默认16市
  return Object.keys(CITY_COORDS).map(name => ({ name, value: 0 }))
})

/** 当前轮播到的城市 */
const statsCarouselCity = computed(() => {
  const cities = statsCarouselCities.value
  if (cities.length === 0) return null
  return cities[statsCarouselIndex.value % cities.length]
})

/** 当前轮播城市的统计数据 */
const statsCarouselData = computed(() => {
  const city = statsCarouselCity.value
  if (!city) return mapStatsData.value
  const v = city.value || 0
  // 基于城市 value 生成该城市的独立统计数据
  const seed = city.name.charCodeAt(0) + city.name.charCodeAt(city.name.length - 1)
  return [
    { label: '发生面积', value: (v * 4.2).toFixed(0) + '亩', color: '#fbbf24' },
    { label: '防治面积', value: (v * 5.3).toFixed(0) + '亩', color: '#2F6F9F' },
    { label: '监测点数', value: (seed % 8 + 3) + '个', color: '#34d399' },
    { label: '平均危害率', value: (v % 15 + 5).toFixed(0) + '%', color: '#f87171' }
  ]
})

/**
 * ★ 更新轮播面板位置（将城市地理坐标转换为像素坐标）
 */
function updateStatsPanelPos() {
  if (!chartInstance) return
  const city = statsCarouselCity.value
  if (!city) return

  const coord = CITY_COORDS[city.name]
  if (!coord) return

  const pixelPos = chartInstance.convertToPixel({ seriesIndex: 0 }, coord)
  if (!pixelPos) return

  // 面板显示在城市右上方，偏移避免遮挡城市标签
  statsPanelPos.value = {
    x: pixelPos[0] + 15,
    y: pixelPos[1] - 70
  }
}

// 监听轮播索引变化，更新面板位置
watch(statsCarouselIndex, () => {
  nextTick(() => updateStatsPanelPos())
})

// 监听城市数据变化，初始化位置
watch(statsCarouselCity, () => {
  nextTick(() => updateStatsPanelPos())
})

/** 启动统计面板轮播 */
function startStatsCarousel() {
  if (statsCarouselTimer) clearInterval(statsCarouselTimer)
  if (statsCarouselCities.value.length === 0) return
  // 立即更新一次位置
  nextTick(() => updateStatsPanelPos())
  statsCarouselTimer = setInterval(() => {
    statsCarouselIndex.value = (statsCarouselIndex.value + 1) % statsCarouselCities.value.length
  }, props.carouselInterval)
}

/** 停止统计面板轮播 */
function stopStatsCarousel() {
  if (statsCarouselTimer) {
    clearInterval(statsCarouselTimer)
    statsCarouselTimer = null
  }
}

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

// ============================================
// 计算属性
// ============================================

/** ECharts 配置项 */
// 主题色相关：将 hex 转为 rgba
const themeHex = computed(() => props.themeColor || '#f59e0b')
function themeRgba(alpha: number): string {
  const hex = themeHex.value.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const chartOption = computed(() => {
  // ============================================
  // ★ 下钻模式：返回区县散点数据（市级/县级）
  // ============================================
  if (isDrilledDown.value && currentMapLevel.value !== 'province') {
    const isCounty = currentMapLevel.value === 'county'
    const isCity = currentMapLevel.value === 'city'

    // 构建 geo 配置
    const geoConfig: any = {
      map: currentGeoMapName.value,
      roam: true,
      zoom: isCounty ? 1.5 : 1.2,
      center: undefined,
      silent: false,
      label: {
        show: true,
        fontSize: isCounty ? 14 : 12,
        color: isCounty ? '#ffffff' : '#e2e8f0',
        fontWeight: isCounty ? 700 : 500,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowBlur: isCounty ? 4 : 3,
        textShadowOffsetX: 1,
        textShadowOffsetY: 1
      },
      emphasis: {
        label: {
          show: true,
          color: isCounty ? '#fbbf24' : '#fff',
          fontSize: isCounty ? 16 : 15,
          fontWeight: isCounty ? 800 : 700,
          textShadowColor: 'rgba(0, 0, 0, 1)',
          textShadowBlur: isCounty ? 6 : 4,
          textShadowOffsetX: 1,
          textShadowOffsetY: 1
        },
        itemStyle: isCounty
          ? { areaColor: '#10b981', shadowColor: 'rgba(16, 185, 129, 0.6)', shadowBlur: 25, borderWidth: 3, borderColor: '#34d399' }
          : { areaColor: 'rgba(20, 80, 120, 0.9)', shadowBlur: 25 }
      },
      itemStyle: isCounty
        ? { areaColor: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.6)', borderWidth: 2 }
        : { areaColor: 'rgba(6, 28, 52, 0.75)', borderColor: 'rgba(80, 200, 255, 0.7)', borderWidth: 2, shadowColor: 'rgba(56, 189, 248, 0.55)', shadowBlur: 30 }
    }

    // 构建 series
    let seriesConfig: any[] = []
    if (isCity && drillDownScatterData.value.length > 0) {
      const ddVals = drillDownScatterData.value.map((d: any) => d.value || 0)
      const ddMax = Math.max(...ddVals, 1)
      const ddMin = Math.min(...ddVals, 0)
      const ddData = drillDownScatterData.value.map((d: any) => {
        const level = calcDensityLevel(d.value || 0, ddMax, ddMin, currentMapLevel.value)
        const color = DENSITY_LEVELS.value[level - 1]?.color || '#ffd000'
        const size = DENSITY_LEVELS.value[level - 1]?.size || [18, 22]
        const shadow = DENSITY_LEVELS.value[level - 1]?.shadowRgba || 'rgba(255,208,0,.35)'
        console.log(`[CenterMap] 🎨 ${d.name}: value=${d.value}, level=${level}, color=${color}`)
        return {
          name: d.name || '未知点位',
          value: [d.coord[0], d.coord[1], d.value || 0, level],
          itemStyle: { color, borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1.8, shadowBlur: 8, shadowColor: shadow, opacity: 0.95 },
          symbolSize: size,
          emphasis: { scale: 1.4, itemStyle: { shadowBlur: 18, shadowColor: color + '66' }, label: { show: true } }
        }
      })
      // ★ 下钻数据直接构建 series，不使用 buildScatterSeries（避免 series-level 函数回调覆盖 data-level 颜色）
      seriesConfig = [{
        type: 'scatter' as const,
        coordinateSystem: 'geo' as const,
        data: ddData,
        name: '区县监测',
        label: { show: false },
        tooltip: {
          trigger: 'item' as const,
          backgroundColor: 'rgba(12,28,46,.97)',
          borderColor: 'rgba(59,130,246,.35)',
          borderWidth: 1.5,
          borderRadius: 10,
          padding: [14, 18],
          textStyle: { color: '#e2e8f0', fontSize: 12 },
          extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,.45);backdrop-filter:blur(12px)',
          formatter: (params: any) => {
            const v = params.value || []
            const lv = v[3] || 3
            const densityLabel = DENSITY_LEVELS.value[lv - 1]?.label || '未知'
            const densityColor = DENSITY_LEVELS.value[lv - 1]?.color || '#ffd000'
            return `<div style="min-width:160px">
              <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#e2e8f0">📌 ${params.name}</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#94a3b8">虫害值</span><span style="font-weight:700;color:#e2e8f0">${v[2] || 0} 头/亩</span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#94a3b8">危害等级</span><span style="font-weight:700;color:${densityColor}">${densityLabel}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#94a3b8">坐标</span><span style="color:#64748b">${Number(v[0]).toFixed(2)}, ${Number(v[1]).toFixed(2)}</span></div>
            </div>`
          }
        }
      }]
    }

    return {
      backgroundColor: 'transparent',
      visualMap: { show: false } as any,
      geo: geoConfig,
      series: seriesConfig
    }
  }

  // ============================================
  // 省级模式
  // ============================================
  return {
    backgroundColor: 'transparent',
    title: {
      text: '',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#e2e8f0'
      }
    },
    // ★ 站点/设备/离线/灯诱/性诱/生境模式：禁用全局tooltip（点击弹窗替代）
    ...(isDistributionMode.value ? {
      trigger: 'none',
      backgroundColor: 'rgba(8,16,30,.95)',
      borderColor: 'rgba(100,180,240,.4)',
      borderWidth: 1,
      borderRadius: 8,
      padding: [6, 10],
      textStyle: { color: '#c8e4ff', fontSize: 13 },
      formatter: (params: any) => `设备名称：${params.name}`
    } : {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: themeRgba(0.3),
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#e2e8f0',
        fontSize: 13
      },
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-radius: 8px;',
      formatter: (params: any) => {
        if (params.seriesType === 'map') {
          return `<strong>${params.name}</strong><br/>监测值: <span style="color:${themeHex.value};font-weight:700">${params.value || 0}</span>`
        }
        return params.name
      }
    }),
    // ★ heatmap 模式：右侧图例（4级色阶，匹配原型图）
    ...(currentMapMode.value === 'heatmap' ? {
      visualMap: {
        show: true,
        type: 'piecewise',
        seriesIndex: 0,
        dimension: 2,
        min: 0,
        max: 100,
        left: 'right',
        top: 'center',
        orient: 'vertical',
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 8,
        textGap: 8,
        textStyle: { fontSize: 11, color: '#e2e8f0' },
        pieces: [
          { gte: 50, label: '50以上', color: '#ff1744' },
          { gte: 30, lt: 50, label: '30-50', color: '#ff6b00' },
          { gte: 15, lt: 30, label: '15-30', color: '#ffd000' },
          { lt: 15, label: '15以下', color: '#2F6F9F' }
        ],
        calculable: false
      }
    } : {
      visualMap: { show: false } as any
    }),
    geo: {
      map: 'shandong',
      roam: true,
      zoom: 1.2,
      center: [118.0, 36.6],
      // ★ 3D 发光边界风格（匹配原型图）
      itemStyle: {
        areaColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || isDistributionMode.value || currentMapMode.value === 'heatmap'
          ? 'rgba(6, 28, 52, 0.75)'
          : themeRgba(0.2),
        borderColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
          ? 'rgba(80, 200, 255, 0.7)'
          : isDistributionMode.value
            ? 'rgba(16, 185, 129, 0.6)'
            : themeRgba(0.4),
        borderWidth: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap' || isDistributionMode.value
          ? 2.2
          : 1.2,
        shadowColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
          ? 'rgba(56, 189, 248, 0.55)'
          : isDistributionMode.value
            ? 'rgba(16, 185, 129, 0.40)'
            : themeRgba(0.15),
        shadowBlur: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap' || isDistributionMode.value
          ? 30
          : 10,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      },
      // ★ 散点图和热力图模式也显示城市标签（匹配原型图）
      label: {
        show: currentMapMode.value === 'choropleth' || currentMapMode.value === 'scatter' || currentMapMode.value === 'heatmap',
        fontSize: 11,
        color: 'rgba(200, 228, 255, 0.85)',
        fontWeight: 500,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowBlur: 3,
        textShadowOffsetX: 1,
        textShadowOffsetY: 1
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          textShadowColor: 'rgba(0, 0, 0, 0.9)',
          textShadowBlur: 4,
          textShadowOffsetX: 1,
          textShadowOffsetY: 1
        },
        itemStyle: {
          areaColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
            ? 'rgba(20, 80, 120, 0.9)'
            : currentMapMode.value === 'station'
              ? 'rgba(6, 78, 59, 0.9)'
              : themeHex.value,
          shadowColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
            ? 'rgba(56, 189, 248, 0.5)'
            : currentMapMode.value === 'station'
              ? 'rgba(16, 185, 129, 0.5)'
              : themeRgba(0.5),
          shadowBlur: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap' || currentMapMode.value === 'station'
            ? 30
            : 20,
          borderWidth: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
            ? 2.2
            : currentMapMode.value === 'station'
              ? 2.2
              : 1.5,
          borderColor: currentMapMode.value === 'scatter' || currentMapMode.value === 'gis' || currentMapMode.value === 'heatmap'
            ? 'rgba(96, 220, 250, 0.8)'
            : currentMapMode.value === 'station'
              ? 'rgba(52, 211, 153, 0.8)'
              : themeHex.value
        }
      },
      silent: false
    },
    series: getSeriesConfig()
  }
})

// ============================================
// ★ 共享：等级配置表（scatter / GIS / heatmap 统一使用）
// ============================================

/** 虫害密度 5 级配置（原型色系：蓝/绿/黄/橙/红） */
const DENSITY_LEVELS = computed(() => {
  return [
    { level: 1, label: '15以下', color: '#2F6F9F',       size: [12, 12], bgRgba: 'rgba(47, 111, 159,0.85)',   shadowRgba: 'rgba(47, 111, 159,0.45)' },
    { level: 2, label: '15-30',  color: '#39ff14',       size: [15, 15], bgRgba: 'rgba(57,255,20,0.85)',   shadowRgba: 'rgba(57,255,20,0.50)' },
    { level: 3, label: '30-50',  color: '#ffd000',       size: [18, 18], bgRgba: 'rgba(255,208,0,0.88)',   shadowRgba: 'rgba(255,208,0,0.55)' },
    { level: 4, label: '50以上',  color: '#ff6b00',       size: [21, 21], bgRgba: 'rgba(255,107,0,0.90)',   shadowRgba: 'rgba(255,107,0,0.60)' },
    { level: 5, label: '极高',    color: '#ff1744',       size: [25, 25], bgRgba: 'rgba(255,23,68,0.92)',   shadowRgba: 'rgba(255,23,68,0.70)' }
  ]
})

/** 根据密度值计算离散等级 (1-5) — 按地图级别区分策略 */
function calcDensityLevel(value: number, maxValue: number, minValue: number = 0, level?: string): number {
  // 市级(展示区县)和县级：数据范围小且分散 → 用相对5等分确保颜色丰富
  const useRelative = level === 'county' || level === 'city'

  if (useRelative) {
    // 区县级/市级下钻：数据值跨度大 → 5等分均匀分布
    const span = Math.max(maxValue - minValue, 1)
    const r = (value - minValue) / span
    if (r >= 0.80) return 5
    if (r >= 0.60) return 4
    if (r >= 0.40) return 3
    if (r >= 0.20) return 2
    return 1
  }

  // 省级：按值区间绝对分档（匹配原型图图例：15以下/15-30/30-50/50以上）
  if (value >= 50) return 5   // 极高 → 红
  if (value >= 30) return 4   // 高 → 橙
  if (value >= 15) return 3   // 中 → 黄
  if (value >= 8) return 2    // 中低 → 绿
  return 1                    // 低 → 蓝
}

/**
 * 构建徽章式 label rich 配置（散点/GIS 共用）
 * @param badgeKey - rich text key 前缀（避免多系列冲突）
 */
function buildBadgeRich(badgeKey: string = '') {
  const bk = badgeKey
  return {
    [`${bk}badgeBg`]: {
      width: '100%', height: 26,
      backgroundColor: (p: any) => {
        const lv = p.data?.value[3] || 3
        return DENSITY_LEVELS.value[lv - 1]?.bgRgba || DENSITY_LEVELS.value[2].bgRgba
      },
      borderRadius: 6, shadowBlur: 10,
      shadowColor: (p: any) => {
        const lv = p.data?.value[3] || 3
        return DENSITY_LEVELS.value[lv - 1]?.shadowRgba || DENSITY_LEVELS.value[2].shadowRgba
      },
      shadowOffsetY: 2, align: 'center'
    },
    [`${bk}val`]: {
      fontSize: 13, fontWeight: 800, color: '#fff',
      padding: [3, 10], align: 'center', verticalAlign: 'middle',
      lineHeight: 20, height: 22,
      fontFamily: '"DIN Alternate", "Roboto Mono", monospace'
    },
    [`${bk}city`]: {
      fontSize: 11, color: '#94a3b8', fontWeight: 500,
      align: 'center', lineHeight: 16, padding: [1, 0]
    }
  }
}

/**
 * 构建 tooltip formatter 函数（农业指标弹窗，散点/GIS 共用）
 * @param borderColor - 弹窗边框颜色
 */
function buildTooltipFormatter(borderColor: string = 'rgba(59,130,246,.35)') {
  return (params: any) => {
    const d = params.data || params
    const name = d.name || ''
    const densityVal = d.value?.[2] || 0
    const lv = d.value?.[3] || 3
    const cfg = DENSITY_LEVELS.value[Math.min(lv - 1, 4)]

    return `
      <div style="min-width:260px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid ${borderColor}">
          <span style="font-size:20px">📍</span>
          <div>
            <div style="font-weight:700;color:#60a5fa;font-size:14px">${name}</div>
            <div style="font-size:11px;color:#64748b">植保监测站</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:${cfg.color}15;border-radius:4px;border-left:3px solid ${cfg.color}">
            <span style="color:#94a3b8;font-size:11px">📊 虫害密度</span>
            <span style="color:${cfg.color};font-weight:700;font-size:15px">${densityVal} <small style="font-weight:400;color:#94a3b8;font-size:10px">头/亩</small></span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:${cfg.color}12;border-radius:4px;border-left:3px solid ${cfg.color}">
            <span style="color:#94a3b8;font-size:11px">⚠️ 危险等级</span>
            <span><span style="background:${cfg.color};color:#fff;padding:2px 10px;border-radius:6px;font-size:11px;font-weight:700">${lv}级 · ${cfg.label}</span></span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(245,158,11,.08);border-radius:4px;border-left:3px solid #f59e0b">
            <span style="color:#94a3b8;font-size:11px">🌾 发生面积</span>
            <span style="color:#fbbf24;font-weight:600;font-size:13px">${Math.round(densityVal * 42)} 亩</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(16,185,129,.08);border-radius:4px;border-left:3px solid #10b981">
            <span style="color:#94a3b8;font-size:11px">✅ 防治面积</span>
            <span style="color:#34d399;font-weight:600;font-size:13px">${Math.round(densityVal * 33)} 亩</span>
          </div>
        </div>
      </div>`
  }
}

/**
 * 从市级 GeoJSON 自动生成区县级散点数据
 * 提取每个区县的几何中心作为坐标，生成模拟密度值
 */
function generateDistrictScatterData(geoJson: any): any[] {
  const features = geoJson?.features || []
  if (features.length === 0) return []

  return features.map((feature: any, index: number) => {
    const name = feature.properties?.name || `区县${index + 1}`
    // 计算多边形几何中心
    const coord = getFeatureCentroid(feature)
    // 模拟区县级密度值（头/亩级别，范围 200-1200，分布较散）
    const value = Math.floor(300 + Math.random() * 900)

    return { name, value, coord }
  }).filter(d => d.coord && d.coord.length >= 2)
}

/**
 * 计算 GeoJSON feature 的几何中心（支持 Polygon 和 MultiPolygon）
 */
function getFeatureCentroid(feature: any): [number, number] | null {
  try {
    const geometry = feature.geometry
    if (!geometry) return null

    let coordinates: number[][][] = []

    if (geometry.type === 'Polygon') {
      coordinates = [geometry.coordinates[0]] // 取外环
    } else if (geometry.type === 'MultiPolygon') {
      // 取最大面积的多边形外环
      const rings = geometry.coordinates.map((p: any) => p[0])
      coordinates = [rings.reduce((a: any, b: any) =>
        polygonArea(a) > polygonArea(b) ? a : b)]
    } else {
      return null
    }

    const ring = coordinates[0]
    if (!ring || ring.length === 0) return null

    let x = 0, y = 0
    for (const pt of ring) {
      x += pt[0]
      y += pt[1]
    }
    return [x / ring.length, y / ring.length]
  } catch {
    return null
  }
}

/** 计算多边形面积（用于找最大面） */
function polygonArea(ring: any[]): number {
  let area = 0
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    area += ring[i][0] * ring[j][1]
    area -= ring[j][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

/**
 * 构建标准散点 series 配置（scatter / GIS 散点层共用）
 * @param data - 带 [lng,lat,value,level] 的数据数组
 * @param opts - 可选覆盖项
 */
function buildScatterSeries(data: any[], opts?: {
  name?: string, zlevel?: number, scaleOnEmphasis?: number,
  badgeKey?: string, tooltipBorderColor?: string
}): any {
  const bk = opts?.badgeKey || ''
  return {
    type: 'scatter' as const,
    coordinateSystem: 'geo' as const,
    data,
    name: opts?.name || '监测站点',
    itemStyle: {
      borderWidth: 1.8,
      borderColor: 'rgba(255,255,255,0.85)',
      shadowBlur: 8,
      shadowColor: (p: any) => {
        const lv = p.data?.value[3] || 3
        return DENSITY_LEVELS.value[Math.min(lv - 1, 4)]?.shadowRgba || 'rgba(239,68,68,.30)'
      }
    },
    label: { show: false },
    emphasis: {
      scale: opts?.scaleOnEmphasis || 1.4,
      itemStyle: {
        shadowBlur: 18,
        shadowColor: (p: any) => {
          const lv = p.data?.value[3] || 3
          const c = DENSITY_LEVELS.value[Math.min(lv - 1, 4)]?.color || '#ef4444'
          return `${c}66`
        }
      },
      label: { show: true }
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(12,28,46,.97)',
      borderColor: opts?.tooltipBorderColor || 'rgba(59,130,246,.35)',
      borderWidth: 1.5, borderRadius: 10, padding: [14, 18],
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,.45);backdrop-filter:blur(12px)',
      formatter: buildTooltipFormatter(opts?.tooltipBorderColor)
    },
    zlevel: opts?.zlevel || 5
  }
}

// ============================================
// ★ 分布模式工厂函数（合并 station/offline/lightTrap/sexTrap/habitat 5个模式的重复代码）
// ============================================

interface DistributionSeriesConfig {
  /** 模式名称，用于 series.name / data.name 回退 */
  typeName: string
  /** SVG path 图标 */
  symbol: string
  /** 图标大小 */
  symbolSize?: number
  /** 是否显示城市标签 */
  showLabel?: boolean
  /** itemStyle 覆盖（合并到绿色主题之上） */
  itemStyle?: Record<string, any>
  /** 自定义数据名回退（为空则取城市名） */
  defaultName?: string
}

/**
 * 构建绿色定位针风格分布图系列配置
 * 5个分布模式差异极小，统一由此函数生成，消除 ~300 行重复代码
 */
function buildDistributionSeries(config: DistributionSeriesConfig): any[] {
  const typeName = config.typeName
  const hasMarkers = (props.markers || []).length > 0
  const rawMarkers = hasMarkers ? props.markers : (props.citiesData || [])
    .map((m: any) => ({
      ...m,
      coord: m.coord || CITY_COORDS[m.name as string] || null
    }))
    .filter((m: any) => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)

  const seriesData = rawMarkers.map((m: any) => ({
    name: m.name || typeName,
    value: [m.coord[0], m.coord[1], m.value || 0]
  }))

  const itemStyle = {
    ...GREEN_THEME.itemStyle,
    borderWidth: 1.5,
    shadowBlur: 12,
    ...(config.itemStyle || {})
  }

  const series: any[] = [{
    type: 'scatter' as const,
    coordinateSystem: 'geo' as const,
    data: seriesData,
    name: typeName,
    symbol: config.symbol,
    symbolSize: config.symbolSize || 20,
    itemStyle,
    label: config.showLabel !== false ? GREEN_THEME.label : { show: false },
    emphasis: GREEN_THEME.emphasis,
    tooltip: { trigger: 'none' as const },
    zlevel: 6
  }]

  return series
}

function getSeriesConfig(): any[] {
  const baseSeries: any[] = []

  switch (currentMapMode.value) {
    case 'choropleth':
      // 行政区填色地图
      baseSeries.push({
        type: 'map',
        map: 'shandong',
        geoIndex: 0,
        data: props.citiesData.map(city => ({
          name: city.name,
          value: city.value
        })),
        select: {
          itemStyle: {
            areaColor: themeHex.value,
            borderWidth: 2,
            borderColor: themeHex.value
          }
        }
      })
      break

    case 'heatmap': {
      // ===== 热力图模式：原型图风格 — 连续云团斑块（无离散点） =====
      const hasMarkers = (props.markers || []).length > 0
      let rawMarkers = hasMarkers
        ? (props.markers || []).filter(m => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)
        : (props.citiesData || [])
            .map((m: any) => ({
              ...m,
              coord: m.coord || CITY_COORDS[m.name as string] || null
            }))
            .filter((m: any) => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)

      // ★ 使用 scatter 模拟热力图：每个城市一个点，大小=值，半透明叠加形成热力效果
      //    关键：itemStyle 必须设在每个数据点上（ECharts scatter 不支持 series 级回调函数）
      const heatmapScatterData: any[] = rawMarkers.map((city: any) => {
        const v = Math.max(city.value || 0, 1)
        let color = '#2F6F9F'
        let shadowColor = 'rgba(47,111,159,0.5)'
        if (v >= 50) { color = '#ff1744'; shadowColor = 'rgba(255,23,68,0.5)' }
        else if (v >= 30) { color = '#ff6b00'; shadowColor = 'rgba(255,107,0,0.5)' }
        else if (v >= 15) { color = '#ffd000'; shadowColor = 'rgba(255,208,0,0.5)' }

        return {
          name: city.name,
          value: [city.coord[0], city.coord[1], v],
          itemStyle: {
            color,
            borderWidth: 0,
            shadowBlur: 20,
            shadowColor
          }
        }
      })

      console.log(`[CenterMap] 🔥 热力图: ${rawMarkers.length} 城市 → ${heatmapScatterData.length} 点`)

      baseSeries.push({
        name: '虫害密度热力',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: heatmapScatterData,
        symbol: 'circle',
        symbolSize: (val: any[]) => {
          const v = val[2] || 0
          return Math.max(30, Math.min(70, v * 0.85))
        },
        itemStyle: {
          opacity: 0.55
        },
        label: { show: false },
        emphasis: { scale: 1.3, itemStyle: { opacity: 0.8 } },
        tooltip: {
          trigger: 'item',
          formatter: (p: any) => {
            const v = p.data?.value?.[2] || 0
            let level = '低'
            if (v >= 50) level = '极高'
            else if (v >= 30) level = '高'
            else if (v >= 15) level = '中'
            return `${p.data?.name}<br/>虫害密度：<b>${v}</b>（${level}）`
          }
        },
        zlevel: 2
      })
      break
    }

    case 'scatter': {
      // ===== 重点区县散点图：等级驱动颜色+大小 + visualMap piecewise 图例 =====
      // 优先使用 markers，回退到 citiesData（补充 CITY_COORDS 坐标）
      const hasMarkers = (props.markers || []).length > 0
      const rawMarkers = hasMarkers ? props.markers : (props.citiesData || [])
        .map((m: any) => ({
          ...m,
          coord: m.coord || CITY_COORDS[m.name as string] || null
        }))
        .filter((m: any) => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)
      const vals = rawMarkers.map((m: any) => m.value || 0)
      const maxD = Math.max(...vals, 1)
      const minD = Math.min(...vals, 0)

      const scatterData = rawMarkers.map((m: any) => {
        const level = calcDensityLevel(m.value || 0, maxD, minD, currentMapLevel.value)
        const color = DENSITY_LEVELS.value[level - 1]?.color || '#ffd000'
        const size = DENSITY_LEVELS.value[level - 1]?.size || [18, 22]
        const shadow = DENSITY_LEVELS.value[level - 1]?.shadowRgba || 'rgba(255,208,0,.35)'
        return {
          name: m.name || '未知点位',
          value: [m.coord[0], m.coord[1], m.value || 0, level],
          itemStyle: { color, borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1.8, shadowBlur: 8, shadowColor: shadow, opacity: 0.95 },
          symbolSize: size,
          emphasis: { scale: 1.4, itemStyle: { shadowBlur: 18, shadowColor: color + '66' }, label: { show: true } }
        }
      })

      if (!hasMarkers) {
        // ★ 重点区县散点图：彩色圆点 + 数值标签 + 详细弹窗（匹配原型图）
        baseSeries.push({
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          name: '虫害密度',
          symbol: 'circle',
          symbolSize: (val: any[]) => {
            const v = val[2] || 0
            const ratio = v / maxD
            return Math.max(14, Math.min(30, 14 + ratio * 16))
          },
          itemStyle: {
            color: (params: any) => {
              const level = params.data?.value?.[3] || 1
              return DENSITY_LEVELS.value[level - 1]?.color || '#ffd000'
            },
            opacity: 0.9,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.8)',
            shadowBlur: 10,
            shadowColor: (params: any) => {
              const level = params.data?.value?.[3] || 1
              return DENSITY_LEVELS.value[level - 1]?.shadowRgba || 'rgba(255,208,0,.35)'
            }
          },
          label: {
            show: true,
            position: 'inside',
            formatter: (p: any) => p.data?.value?.[2] || '',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowBlur: 3
          },
          emphasis: {
            scale: 1.5,
            itemStyle: {
              shadowBlur: 24,
              shadowColor: 'rgba(255,200,0,.6)'
            },
            label: { show: true, fontSize: 12 }
          },
          // ★ 详细弹窗（匹配原型图：发生面积/防治面积/监测点数/平均危害率）
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(8,16,30,.97)',
            borderColor: 'rgba(100,180,240,.4)',
            borderWidth: 1.5,
            borderRadius: 10,
            padding: [14, 18],
            textStyle: { color: '#c8e4ff', fontSize: 12 },
            extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,.5);backdrop-filter:blur(12px)',
            formatter: (p: any) => {
              const v = p.data?.value?.[2] || 0
              const lv = p.data?.value?.[3] || 1
              const densityLabel = DENSITY_LEVELS.value[lv - 1]?.label || '未知'
              const densityColor = DENSITY_LEVELS.value[lv - 1]?.color || '#ffd000'
              // 基于虫害值生成原型图风格的统计数据
              const occurArea = Math.round(v * 4.2)
              const controlArea = Math.round(v * 3.3)
              const monitorPoints = (lv % 4) + 2
              const damageRate = Math.min(Math.round(v / maxD * 80 + 10), 95)
              return `<div style="min-width:200px">
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#fbbf24;border-bottom:1px solid rgba(100,180,240,.2);padding-bottom:6px">📍 ${p.data?.name || ''}</div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#94a3b8">发生面积</span><span style="font-weight:700;color:#fbbf24">${occurArea} 亩</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#94a3b8">防治面积</span><span style="font-weight:700;color:#34d399">${controlArea} 亩</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#94a3b8">监测点数</span><span style="font-weight:700;color:#7dd3fc">${monitorPoints} 个</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#94a3b8">平均危害率</span><span style="font-weight:700;color:${damageRate > 50 ? '#ef4444' : '#fbbf24'}">${damageRate}%</span></div>
                <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid rgba(100,180,240,.15)"><span style="color:#94a3b8">危害等级</span><span style="font-weight:700;color:${densityColor}">${densityLabel}</span></div>
              </div>`
            }
          },
          zlevel: 5
        })

        // 城市名称标签
        baseSeries.push({
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData.map((m: any) => ({
            name: m.name,
            value: [m.value[0], m.value[1], m.value[2]]
          })),
          name: '城市名称',
          symbolSize: 0,
          silent: true,
          zlevel: 3,
          label: { show: false }
        })
      } else {
        // 虫害监测场景：散点气泡 + 徽章标签
        baseSeries.push(buildScatterSeries(scatterData, {
          name: '虫害监测点', zlevel: 5, scaleOnEmphasis: 1.4,
          badgeKey: ''
        }))
      }
      break
    }

    case 'effectScatter':
      // 涟散特效散点
      baseSeries.push({
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: (props.markers || [])
          .filter(m => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)
          .map(m => ({
            name: m.name || '未知点位',
            value: [...m.coord, m.value || 0]
          })),
        symbolSize: (val: number[]) => Math.max(val[2] / 12, 8),
        rippleEffect: {
          brushType: 'stroke',
          scale: 4,
          period: 3
        },
        itemStyle: {
          color: props.themeColor,
          shadowBlur: 15,
          shadowColor: props.themeColor
        }
      })
      break

    case 'gis': {
      // ===== GIS 组合模式：热力图层 + 徽章散点（复用 buildScatterSeries） =====
      // 1) 热力图底层（虫害密度空间分布）
      const gisHeatData = (props.gisHeatmapPoints || [])
        .filter(p => p.coord && Array.isArray(p.coord) && p.coord.length >= 2)
        .map(p => ({ name: p.name, value: [p.coord[0], p.coord[1], p.value] }))

      if (gisHeatData.length > 0) {
        baseSeries.push({
          name: '虫害密度分布',
          type: 'heatmap', coordinateSystem: 'geo',
          data: gisHeatData,
          pointSize: 16, blurSize: 26,
          minOpacity: 0.10, maxOpacity: 0.80,
          silent: true, label: { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.5)' } },
          zlevel: 1
        })
      }

      // 2) 散点标记层（植保监测站点 → 复用 buildScatterSeries）
      const gisStationData = (props.gisStationMarkers || [])
        .filter(p => p.coord && Array.isArray(p.coord) && p.coord.length >= 2)
        .map(p => ({
          name: p.name,
          value: [p.coord[0], p.coord[1], p.value || 0, p.level || 3]
        }))

      if (gisStationData.length > 0) {
        baseSeries.push(buildScatterSeries(gisStationData, {
          name: '监测站点', zlevel: 10, scaleOnEmphasis: 1.35,
          badgeKey: 'gis',
          tooltipBorderColor: 'rgba(245,158,11,.35)'
        }))
      }
      break
    }

    case 'station': {
      baseSeries.push(...buildDistributionSeries({
        typeName: '监测站点',
        symbol: 'path://M12 2C8.13 2 5 5.13 5 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        itemStyle: { shadowOffsetY: 2 }
      }))
      break
    }

    case 'device': {
      // ★ 设备分布模式：黄色脉冲圆环图标（仿原型图），点击显示设备名称弹窗

      const CITY_COORDS: Record<string, [number, number]> = {
        '济南市': [117.0, 36.65], '青岛市': [120.38, 36.07], '烟台市': [121.39, 37.54],
        '潍坊市': [119.11, 36.71], '临沂市': [118.35, 35.05], '淄博市': [118.04, 36.81],
        '济宁市': [116.58, 35.41], '泰安市': [117.12, 36.19], '威海市': [122.12, 37.51],
        '德州市': [116.30, 37.45], '聊城市': [115.98, 36.46], '滨州市': [117.97, 37.38],
        '菏泽市': [115.47, 35.24], '枣庄市': [117.55, 34.86], '日照市': [119.53, 35.42],
        '东营市': [118.49, 37.46]
      }

      const hasMarkers = (props.markers || []).length > 0
      const rawMarkers = hasMarkers ? props.markers : (props.citiesData || [])
        .map((m: any) => ({
          ...m,
          coord: m.coord || CITY_COORDS[m.name as string] || null
        }))
        .filter((m: any) => m.coord && Array.isArray(m.coord) && m.coord.length >= 2)

      const deviceData = rawMarkers.map((m: any) => ({
        name: m.name || '设备',
        value: [m.coord[0], m.coord[1], m.value || 0]
      }))

      baseSeries.push({
        type: 'effectScatter' as const,
        coordinateSystem: 'geo' as const,
        data: deviceData,
        name: '设备',
        symbolSize: (val: any[]) => {
          const v = val[2] || 10
          return Math.max(12, Math.min(28, v / 5))
        },
        showEffectOn: 'render' as const,
        rippleEffect: {
          brushType: 'stroke' as const,
          scale: 3,
          period: 4,
          number: 2
        },
        itemStyle: {
          color: '#fde68a',
          borderColor: '#fbbf24',
          borderWidth: 1.5,
          shadowBlur: 16,
          shadowColor: 'rgba(251,191,36,.45)',
          opacity: 0.92
        },
        label: { show: false },
        emphasis: {
          scale: 1.6,
          itemStyle: {
            color: '#fef3c7',
            borderColor: '#f59e0b',
            borderWidth: 2,
            shadowBlur: 24,
            shadowColor: 'rgba(245,158,11,.60)'
          }
        },
        tooltip: { trigger: 'none' as const },
        zlevel: 6
      })
      break
    }

    case 'offline': {
      baseSeries.push(...buildDistributionSeries({
        typeName: '离线',
        symbol: 'path://M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h6l3 3 3-3h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H17l-2.5 2.5L12 16H4V5h16v11z',
        symbolSize: 22
      }))
      break
    }

    case 'lightTrap': {
      baseSeries.push(...buildDistributionSeries({
        typeName: '灯诱',
        symbol: 'path://M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
        symbolSize: 22,
        itemStyle: { shadowBlur: 14 }
      }))
      break
    }

    case 'sexTrap': {
      baseSeries.push(...buildDistributionSeries({
        typeName: '性诱',
        symbol: 'path://M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        itemStyle: { borderWidth: 1.8, shadowBlur: 14 }
      }))
      break
    }

    case 'habitat': {
      baseSeries.push(...buildDistributionSeries({
        typeName: '生境',
        symbol: 'path://M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        itemStyle: { borderWidth: 1.8, shadowBlur: 14 }
      }))
      break
    }

    default:
      // 默认模式（无数据）
      break
  }

  // 🎯 追加虫害监测散点图层（仅在特定模式+有markers时启用）
  // heatmap/scatter/station/device/offline/lightTrap/sexTrap/habitat 模式不叠加（各自有独立渲染）
  const canAddPestOverlay = !isDistributionMode.value && currentMapMode.value !== 'scatter' && currentMapMode.value !== 'heatmap' && props.showPestScatter && pestScatterData.value.length > 0
  if (canAddPestOverlay) {
    baseSeries.push({
      name: '虫害监测点',
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: pestScatterData.value.map((point: any) => ({
        name: point.name,
        value: [...point.coord, point.value, point.level],
        pestType: point.pestType,
        level: point.level
      })),
      symbolSize: (val: any[]) => {
        const level = val[3] || 3
        return Math.max(8, Math.min(30, level * 6))  // 根据等级调整大小
      },
      showEffectOn: 'render',
      rippleEffect: {
        brushType: 'stroke',
        scale: 3,
        period: 4
      },
      itemStyle: {
        color: (params: any) => {
          const lv = Math.min(Math.max(params.data?.value[3] || 3, 1), 5)
          return DENSITY_LEVELS.value[lv - 1]?.color || '#ffd000'
        },
        shadowBlur: 14,
        shadowColor: (params: any) => {
          const lv = Math.min(Math.max(params.data?.value[3] || 3, 1), 5)
          return DENSITY_LEVELS.value[lv - 1]?.shadowRgba || 'rgba(255,208,0,0.5)'
        }
      },
      emphasis: {
        scale: 1.8,
        itemStyle: {
          shadowBlur: 24,
          shadowColor: (params: any) => {
            const lv = Math.min(Math.max(params.data?.value[3] || 3, 1), 5)
            const c = DENSITY_LEVELS.value[lv - 1]?.color || '#ffd000'
            return `${c}99`
          }
        }
      },
      label: {
        show: false
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        borderWidth: 1.5,
        borderRadius: 10,
        padding: [14, 18],
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        extraCssText: 'box-shadow: 0 8px 28px rgba(0,0,0,0.4); backdrop-filter: blur(10px);',
        formatter: (params: any) => {
          const data = params.data || params
          const point = pestScatterData.value.find(p =>
            p.coord[0] === data.value[0] && p.coord[1] === data.value[1]
          )
          if (!point) return ''

          const level = point.level
          const levelColor = level >= 4 ? '#dc2626' : level === 3 ? '#ef4444' : '#f87171'
          const levelText = level >= 5 ? '极高危' : level === 4 ? '高危' : level === 3 ? '中等' : level === 2 ? '低危' : '安全'

          return `
            <div style="min-width:220px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(245,158,11,0.25)">
                <span style="font-size:20px">${level >= 4 ? '🔴' : level === 3 ? '🟠' : '🟡'}</span>
                <div>
                  <div style="font-weight:700;color:#fbbf24;font-size:14px">${point.name}</div>
                  <div style="font-size:11px;color:#64748b">监测站点</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(16,185,129,0.1);border-radius:4px;border-left:3px solid #10b981">
                  <span style="color:#94a3b8;font-size:11px">🐛 虫害类型</span>
                  <span style="color:#10b981;font-weight:600;font-size:13px">${point.pestType}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(245,158,11,0.1);border-radius:4px;border-left:3px solid #f59e0b">
                  <span style="color:#94a3b8;font-size:11px">📊 监测虫量</span>
                  <span style="color:#f59e0b;font-weight:700;font-size:16px">${point.value} <small style="font-weight:400;color:#94a3b8;font-size:10px">头</small></span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 10px;background:${levelColor}15;border-radius:4px;border-left:3px solid ${levelColor}">
                  <span style="color:#94a3b8;font-size:11px">⚠️ 危险等级</span>
                  <span><span style="background:${levelColor};color:white;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;margin-right:4px">${level}级</span><span style="color:${levelColor};font-weight:600">${levelText}</span></span>
                </div>
              </div>
            </div>
          `
        }
      },
      zlevel: 10  // 确保散点在地图上层显示
    })
  }

  return baseSeries
}

// ============================================
// 核心方法
// ============================================

/**
 * 加载 GeoJSON 数据并注册到 ECharts
 */
async function loadGeoJson() {
  isMapLoading.value = true

  try {
    console.log(`[CenterMap] 📡 正在加载 GeoJSON: ${props.geoJsonUrl}`)

    const response = await fetch(props.geoJsonUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('[CenterMap] ✅ GeoJSON 加载成功:', data.features?.length, '个区域')

    // 注册地图
    echarts.registerMap('shandong', data as any)

    geojsonData.value = data
    emit('geojson-loaded', data)

  } catch (err) {
    console.error('[CenterMap] ❌ GeoJSON 加载失败:', err)
    error.value = err as Error
    emit('error', error.value)
  } finally {
    isMapLoading.value = false
  }
}

// ============================================
// 城市代码映射（用于获取市级 GeoJSON）
// ============================================

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

/**
 * 点击城市时跳转到市级地图
 */
async function zoomToCity(cityName: string) {
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
      console.warn('[CenterMap] ⚠️ 未找到城市代码:', cityName)
      isMapTransitioning.value = false
      return
    }

    console.log(`[CenterMap] 🗺️ 正在加载 ${cityName} 地图数据...`)

    // 从阿里 DataV 获取市级 GeoJSON
    const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${cityCode}_full.json`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法加载 ${cityName} 地图数据`)
    }

    const cityGeoJson = await response.json()

    // 注册市级地图
    echarts.registerMap('currentCity', cityGeoJson as any)

    // ★ 生成区县散点并切换下钻模式（chartOption 自动响应变化）
    drillDownScatterData.value = generateDistrictScatterData(cityGeoJson)
    isDrilledDown.value = true
    currentGeoMapName.value = 'currentCity'
    currentMapLevel.value = 'city'

    console.log(`[CenterMap] ✅ 成功切换到 ${cityName} 地图`)

    // 通知父组件地图级别变更
    emit('map-level-change', 'city', cityName)

  } catch (error) {
    console.error('[CenterMap] ❌ 切换城市地图失败:', error)
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
  console.log(`[CenterMap] 🎯 开始加载县级地图: ${countyName}`)

  if (!chartInstance) {
    console.error('[CenterMap] ❌ chartInstance 不存在')
    return
  }

  if (isMapTransitioning.value) {
    console.warn('[CenterMap] ⚠️ 地图正在切换中，请稍候...')
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

    console.log(`[CenterMap] 📡 正在从阿里 DataV 获取 ${currentCityName.value} 的 GeoJSON... (城市代码: ${cityCode})`)

    // 从阿里 DataV 获取包含所有区县的市级 GeoJSON
    const response = await fetch(
      `https://geo.datav.aliyun.com/areas_v3/bound/${cityCode}_full.json`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法加载 ${countyName} 地图数据`)
    }

    const cityGeoJson = await response.json()
    console.log(`[CenterMap] ✅ 成功获取 ${currentCityName.value} GeoJSON，共 ${cityGeoJson.features.length} 个区域`)

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
      console.log(`[CenterMap] 🔍 精确匹配失败，尝试模糊匹配...`)
    }

    // 如果还是找不到，列出所有可用的区县名称帮助调试
    if (!countyFeature) {
      const availableCounties = cityGeoJson.features.map((f: any) => f.properties.name)
      console.warn(`[CenterMap] ⚠️ 未找到 "${countyName}" 的地理数据`)
      console.log('[CenterMap] 💡 可用的区县列表:', availableCounties.join(', '))
      throw new Error(`未找到区县 "${countyName}"，请检查名称是否正确`)
    }

    console.log(`[CenterMap] ✅ 找到区县: ${countyFeature.properties.name}`)

    // 创建只包含该区县的 GeoJSON
    const countyGeoJson = {
      type: 'FeatureCollection',
      features: [countyFeature]
    }

    // 注册县级地图（使用唯一标识符避免冲突）
    const mapId = `county_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    echarts.registerMap(mapId, countyGeoJson as any)

    // ★ 切换下钻模式（chartOption 自动响应变化）
    drillDownScatterData.value = []
    isDrilledDown.value = true
    currentGeoMapName.value = mapId
    currentMapLevel.value = 'county'

    console.log(`[CenterMap] ✅✅✅ 成功切换到 ${countyName} 县级地图！`)

    // 通知父组件地图级别变更
    emit('map-level-change', 'county', currentCityName.value, countyName)

  } catch (error) {
    console.error('[CenterMap] ❌ 切换县级地图失败:', error)
    showToast(`无法加载 ${countyName} 的地图数据，将返回上一级`)
    backToPreviousLevel()
  } finally {
    setTimeout(() => {
      isMapTransitioning.value = false
      console.log('[CenterMap] 🔓 解除锁定状态')
    }, 500)  // 延长锁定时间确保动画完成
  }
}

/**
 * 返回上一级地图（通用 - 支持多级返回）
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

  console.log(`[CenterMap] 🔙 返回上一级: ${currentMapLevel.value} → ${previousState.level}`)

  // 根据上一级状态恢复地图
  switch (previousState.level) {
    case 'province':
      resetToProvince()
      break

    case 'city':
      // 返回到市级地图
      currentMapLevel.value = 'city'
      currentCountyName.value = ''
      // 重新加载市级地图
      zoomToCity(previousState.cityName).finally(() => {
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

  // 通知父组件地图级别变更
  emit('map-level-change', previousState.level, previousState.cityName, previousState.countyName)
}

/**
 * 重置到省级地图（根级返回）
 */
function resetToProvince() {
  // ★ 复位所有状态 → chartOption 自动切回省级配置
  currentMapLevel.value = 'province'
  currentCityName.value = ''
  currentCountyName.value = ''
  mapHistoryStack.value = []
  drillDownScatterData.value = []
  currentGeoMapName.value = 'shandong'
  isDrilledDown.value = false

  console.log('[CenterMap] 🔙 返回省级地图')

  // 通知父组件地图级别变更
  emit('map-level-change', 'province')
}

/**
 * 加载虫害监测散点数据（从 /api/points）
 */
async function fetchPestScatterPoints() {
  if (!props.showPestScatter) return

  isPestScatterLoading.value = true

  try {
    console.log(`[CenterMap] 🎯 正在加载虫害散点数据: ${props.pestScatterApiUrl}`)

    const response = await fetch(props.pestScatterApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.points && Array.isArray(data.points)) {
      pestScatterData.value = data.points
      console.log('[CenterMap] ✅ 虫害散点数据加载成功:', data.points.length, '个点位')
      emit('pest-scatter-loaded', data.points, data.summary)
    }

  } catch (err) {
    console.error('[CenterMap] ❌ 虫害散点数据加载失败:', err)
    // 不阻塞主地图渲染，仅记录错误
  } finally {
    isPestScatterLoading.value = false
  }
}

/**
 * 刷新图表
 */
function refresh() {
  if (chartInstance) {
    loadGeoJson()
  }
}

/**
 * 放大
 */
function zoomIn() {
  if (chartInstance) {
    const option = chartInstance.getOption()
    const zoom = (option.geo?.[0]?.zoom || 1.2) * 1.2
    chartInstance.setOption({
      geo: [{ zoom: Math.min(zoom, 5) }]
    })
  }
}

/**
 * 缩小
 */
function zoomOut() {
  if (chartInstance) {
    const option = chartInstance.getOption()
    const zoom = (option.geo?.[0]?.zoom || 1.2) / 1.2
    chartInstance.setOption({
      geo: [{ zoom: Math.max(zoom, 0.5) }]
    })
  }
}

/**
 * 重置缩放
 */
function resetZoom() {
  if (chartInstance) {
    chartInstance.setOption({
      geo: [{ zoom: 1.2, center: [118.0, 36.6] }]
    })
  }
}

/**
 * 关闭 Tooltip
 */
function closeTooltip() {
  hoveredCityInfo.value = null
}

// ============================================
// 事件处理函数
// ============================================

function onChartReady(chart: echarts.ECharts) {
  chartInstance = chart
  console.log('[CenterMap] 🎉 ECharts 实例就绪')

  // 注册地图交互事件（点击下钻 + 悬停提示）
  chart.on('click', onChartClick)
  chart.on('mouseover', onChartHover)
  console.log('[CenterMap] ✅ 地图事件已注册：click / mouseover')

  emit('map-ready', chart)
}

/**
 * ★ 地图点击交互引擎（核心）
 *
 * 交互规则：
 *   ┌─────────────┬──────────────────┐
 *   │  地图级别    │   单击 (click)    │
 *   ├─────────────┼──────────────────┤
 *   │  省级        │  下钻到市级地图     │
 *   │  市级        │  下钻到县级地图     │
 *   │  县级        │  无操作（已是底层）  │
 *   └─────────────┴──────────────────┘
 */
function onChartClick(params: any) {
  // ★ 分布模式（站点/设备/离线/灯诱/性诱/生境）：统一点击弹窗处理
  const DISTRIBUTION_MODES: Record<string, { prefix: string; hashLen: number; acceptEffectScatter?: boolean }> = {
    station:   { prefix: '站点', hashLen: 5 },
    device:    { prefix: '设备', hashLen: 6, acceptEffectScatter: true },
    offline:   { prefix: '离线', hashLen: 6 },
    lightTrap: { prefix: '灯诱', hashLen: 6 },
    sexTrap:   { prefix: '性诱', hashLen: 6 },
    habitat:   { prefix: '生境', hashLen: 6 }
  }
  const mode = currentMapMode.value
  const modeCfg = DISTRIBUTION_MODES[mode]
  if (modeCfg) {
    const isMatch = modeCfg.acceptEffectScatter
      ? (params.seriesType === 'scatter' || params.seriesType === 'effectScatter')
      : (params.seriesType === 'scatter')
    if (isMatch && params.data) {
      const cityName = params.data.name || params.name || ''
      stationTipName.value = `${modeCfg.prefix}-${calcCityHash(cityName, modeCfg.hashLen)}`
      stationTipType.value = mode as any
      stationTipPos.value = { x: params.event.offsetX + 10, y: params.event.offsetY - 10 }
      stationTipVisible.value = true
    } else {
      stationTipVisible.value = false
    }
    return
  }

  // ===== 0. 基础过滤 =====
  if (!params.name) return

  // 防抖：同一目标 200ms 内的重复事件忽略（geo + series 双源）
  const now = Date.now()
  if (_lastClickTarget === params.name && now - _lastClickTime < 200) return

  const clickTarget = params.name
  const isScatterClick = params.seriesType === 'scatter' || params.seriesType === 'effectScatter'

  console.log('[CenterMap] 🗺️ 点击:', {
    name: clickTarget,
    componentType: params.componentType,
    seriesType: params.seriesType,
    level: currentMapLevel.value
  })

  _lastClickTarget = clickTarget
  _lastClickTime = now

  // ===== 1. 散点点击：同时触发站点事件 + 下钻 =====
  if (isScatterClick) {
    emit('station-click', { name: clickTarget, value: params.value, event: params.event })
  }

  // ===== 2. 所有点击都尝试下钻（散点和 Geo 区域均可触发）=====
  _handleDrillDown(clickTarget, params)
}

// ============================================
// 单击处理：下钻到下一级地图
// ============================================
function _handleDrillDown(target: string, params: any) {
  // 首次操作后自动隐藏交互提示
  if (showInteractionHint.value) showInteractionHint.value = false

  switch (currentMapLevel.value) {
    case 'province':
      // 省级：单击城市 → 下钻到市级地图
      if (!cityCodeMap[target]) return
      console.log(`[CenterMap] 👆 单击下钻: 省 → 市 (${target})`)
      zoomToCity(target)
      emit('map-level-change', 'city', target)
      break

    case 'city':
      // 市级：单击区县 → 下钻到县级地图
      // 防护：如果点击目标是当前城市名本身（散点残留数据），跳过
      if (target === currentCityName.value) {
        console.log(`[CenterMap] ⏭️ 跳过: 点击目标 "${target}" 与当前城市同名，非区县`)
        return
      }
      console.log(`[CenterMap] 👆 单击下钻: 市 → 县 (${target})`)
      zoomToCounty(target)
      break

    case 'county':
      // 县级：已是最底层，单击无操作
      console.log('[CenterMap] ℹ️ 已是县级最底层')
      break
  }
}

function onChartHover(params: any) {
  // 分布模式（站点/设备/离线/灯诱/性诱/生境）使用ECharts原生tooltip，不触发自定义悬停面板
  if (isDistributionMode.value) return

  if (params.name && params.componentType === 'series') {
    const cityData = props.citiesData.find(c => c.name === params.name)

    if (cityData) {
      hoveredCityInfo.value = cityData

      // 更新 tooltip 位置（基于事件位置）
      if (params.event?.event) {
        tooltipPosition.value = {
          x: params.event.event.offsetX + 20,
          y: params.event.event.offsetY - 20
        }
      }

      emit('city-hover', cityData)
    }
  }
}

function onChartLeave() {
  hoveredCityInfo.value = null
  emit('city-leave')
}

function onChartResize(size: { width: number; height: number }) {
  console.log(`[CenterMap] 📐 尺寸变更: ${size.width}x${size.height}`)
}

function onChartError(err: Error) {
  console.error('[CenterMap] ❌ 图表错误:', err)
  error.value = err
  emit('error', err)
}

function handleToolClick(toolKey: string) {
  activeTool.value = toolKey
  
  switch (toolKey) {
    case 'select':
      resetZoom()
      break
    case 'zoomIn':
      zoomIn()
      break
    case 'zoomOut':
      zoomOut()
      break
    case 'restore':
      refresh()
      break
  }
  
  console.log(`[CenterMap] 🔧 工具切换: ${toolKey}`)
}

function handleAction(actionName: string) {
  activeAction.value = actionName

  // ★ 重点区市 → 散点图模式
  if (actionName === '重点区市') {
    currentMapMode.value = 'scatter'
    console.log('[CenterMap] 📊 切换到散点图模式（重点区市）')
  } else if (actionName === '空间分布') {
    // ★ 空间分布 → 热力图模式
    currentMapMode.value = 'heatmap'
    console.log('[CenterMap] 🔥 切换到热力图模式（空间分布）')
  }

  emit('action', actionName)
}

/**
 * 切换地图可视化模式（热力图 ↔ 散点图）
 */
function switchMapMode(mode: string) {
  if (currentMapMode.value === mode) return

  const previousMode = currentMapMode.value
  currentMapMode.value = mode as any

  // 切换到站点模式时清除散点模式的悬浮面板残留数据
  if (mode === 'station') {
    hoveredCityInfo.value = null
  }

  console.log(`[CenterMap] 🔄 地图模式切换: ${previousMode} → ${mode}`)

  // 触发模式切换事件
  emit('action', `mode-switch-${mode}`)
}

// ============================================
// 监听器
// ============================================

watch(() => props.selectedCity, (newCity) => {
  if (chartInstance && newCity) {
    chartInstance.dispatchAction({
      type: 'select',
      seriesIndex: 0,
      name: newCity
    })
  }
})

// 下钻状态变化时强制 setOption（需要 notMerge:true 清除旧图层）
watch(() => [isDrilledDown.value, currentMapLevel.value, drillDownScatterData.value] as const, () => {
  if (!chartInstance) return
  const opt = chartOption.value
  chartInstance.setOption(opt, true)
}, { deep: false })

// ============================================
// 生命周期
// ============================================

onMounted(async () => {
  console.log('[CenterMap] 🚀 组件已挂载，模式:', props.mapMode)

  try {
    await loadGeoJson()
    console.log('[CenterMap] ✅ GeoJSON 预加载完成，ECharts 可以安全初始化')

    await fetchPestScatterPoints()
    console.log('[CenterMap] ✅ 虫害散点数据加载完成')
  } catch (err) {
    console.error('[CenterMap] ❌ 初始化失败:', err)
  } finally {
    isLoading.value = false
    console.log('[CenterMap] 🎉 地图初始化全部完成，关闭加载状态')

    // ★ 自动启动统计面板城市轮播
    if (props.showLegend && currentMapLevel.value === 'province') {
      setTimeout(() => startStatsCarousel(), 1500)
    }
  }

  // 添加键盘快捷键支持
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 清理 toast 定时器
  if (toastTimer) clearTimeout(toastTimer)

  // 清理统计面板轮播定时器
  stopStatsCarousel()

  // 清理 ECharts 事件监听（防止内存泄漏）
  if (chartInstance) {
    chartInstance.off('click', onChartClick)
    chartInstance.off('mouseover', onChartHover)
    chartInstance.dispose()
    chartInstance = null
  }
  console.log('[CenterMap] 🧹 组件卸载，事件已清理')

  // 移除键盘事件监听器
  window.removeEventListener('keydown', handleKeyDown)
})

/**
 * 处理键盘快捷键
 */
function handleKeyDown(event: KeyboardEvent) {
  // ESC 键返回上一级地图（支持多级）
  if (event.key === 'Escape' && currentMapLevel.value !== 'province') {
    backToPreviousLevel()
  }
}

// ============================================
// 暴露给父组件的方法
// ============================================

defineExpose({
  /** 获取 ECharts 实例 */
  getInstance: () => chartInstance,
  /** 刷新地图 */
  refresh,
  /** 放大 */
  zoomIn,
  /** 缩小 */
  zoomOut,
  /** 重置视图 */
  resetZoom,
  /** 获取当前模式 */
  getMapMode: () => currentMapMode.value,
  /** 设置模式 */
  setMapMode: (mode: string) => {
    switchMapMode(mode)
  },
  /** 获取当前地图级别（省/市/县） */
  getMapLevel: () => currentMapLevel.value,
  /** 获取当前城市名称 */
  getCurrentCityName: () => currentCityName.value,
  /** 获取当前区县名称 */
  getCurrentCountyName: () => currentCountyName.value,
  /** 返回上一级地图 */
  backToPreviousLevel,
  /** 重置到省级地图 */
  resetToProvince,
  /** 跳转到指定城市地图 */
  zoomToCity,
  /** 跳转到指定区县地图 */
  zoomToCounty
})
</script>

<style scoped>
.center-map {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
  height: 100%;
  min-height: 400px;
}

/* ===== GeoJSON 加载状态 ===== */

.geojson-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border-radius: var(--radius-lg, 12px);
  z-index: 5;
}

.loading-spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(245, 158, 11, 0.15);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.geojson-loading .loading-text {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
  letter-spacing: 0.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 工具栏 ===== */

.map-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--duration-200, 200ms);
  font-size: 14px;
}

.tool-btn:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.45);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tool-btn--active {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(245, 158, 11, 0.3);
  margin: 0 8px;
}

/* 模式切换按钮 */
.mode-switch-btn {
  width: auto;
  padding: 0 12px;
  gap: 6px;
  font-size: 13px;
}

.mode-switch-btn .mode-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.mode-switch-btn:hover .mode-label,
.mode-switch-btn--active .mode-label {
  color: #fbbf24;
}

.mode-switch-btn--active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.15));
  border-color: #f59e0b;
  box-shadow: 
    0 0 15px rgba(245, 158, 11, 0.3),
    inset 0 0 10px rgba(245, 158, 11, 0.1);
}

/* ===== 地图标题 ===== */

.map-title {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 20px;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.9),
    rgba(20, 35, 55, 0.85)
  );
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
  letter-spacing: 1px;
  white-space: nowrap;
  z-index: 10;
}

/* ===== 轮播统计面板（浮动在城市坐标位置） ===== */
.map-stats-panel {
  position: absolute;
  background: linear-gradient(135deg, rgba(6,20,32,0.94), rgba(12,30,45,0.92));
  border: 1px solid rgba(47, 111, 159,0.25);
  border-radius: 8px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  z-index: 11;
  min-width: 180px;
  box-shadow:
    0 8px 28px rgba(0,0,0,0.4),
    0 0 16px rgba(47, 111, 159,0.08),
    inset 0 1px 0 rgba(255,255,255,0.04);
  pointer-events: none;
}

/* 浮动模式：跟随城市坐标 */
.map-stats-panel--floating {
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 指向城市的小箭头 */
.stats-panel-arrow {
  position: absolute;
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 7px solid rgba(47, 111, 159, 0.5);
  filter: drop-shadow(-2px 0 2px rgba(0,0,0,0.3));
}

/* 面板移动过渡动画 */
.stats-panel-move-enter-active,
.stats-panel-move-leave-active {
  transition: all 0.4s ease;
}

.stats-panel-move-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.stats-panel-move-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ★ 轮播城市名称标题 */
.stats-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(47, 111, 159, 0.2);
}

.stats-panel-city-name {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.stats-panel-dots {
  display: flex;
  gap: 3px;
}

.stats-dot-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  transition: all 0.3s ease;
}

.stats-dot-indicator--active {
  background: #fbbf24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
  transform: scale(1.3);
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

.stats-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.stats-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

.stats-value {
  font-size: 14px;
  font-weight: 800;
  margin-left: auto;
  font-family: var(--font-number, monospace);
  text-shadow: 0 0 8px currentColor;
}

/* ===== 图例 - 原型风格 ===== */
.map-legend--proto {
  position: absolute;
  bottom: 56px;
  right: 12px;
  background: rgba(6,20,32,0.88);
  border: 1px solid rgba(47, 111, 159,0.2);
  border-radius: 6px;
  padding: 8px 10px;
  z-index: 11;
  min-width: 82px;
}

.proto-legend-bar-wrap {
  width: 100%;
}

.proto-legend-colors {
  display: flex;
  flex-direction: column;
  width: 14px;
  gap: 0;
}

.proto-color-block {
  display: block;
  width: 100%;
  height: 14px;
  border-radius: 1px;
}

.proto-color--orange { background: #ff6b00; }
.proto-color--yellow { background: #ffd000; }
.proto-color--green   { background: #39ff14; }
.proto-color--blue   { background: #2F6F9F; }

.proto-legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding-left: 20px;
}

.proto-legend-labels span {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
}

/* ===== 城市信息提示框 ===== */

.city-tooltip {
  position: absolute;
  min-width: 180px;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.96),
    rgba(20, 35, 55, 0.94)
  );
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 10px;
  padding: 0;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(245, 158, 11, 0.15);
  z-index: 100;
  pointer-events: auto;
  animation: tooltipIn 0.2s ease-out;
}

/* 站点模式：强制隐藏自定义悬浮面板（CSS优先级最高，不受JS时序影响） */
.center-map--station .city-tooltip {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

@keyframes tooltipIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(245, 158, 11, 0.1);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 10px 10px 0 0;
}

.tooltip-city-name {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.tooltip-close {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tooltip-close:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(1.1);
}

.tooltip-body {
  padding: 12px 14px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.tooltip-label {
  font-size: 12px;
  color: #94a3b8;
}

.tooltip-value {
  font-size: 16px;
  font-weight: 700;
}

/* Tooltip 过渡动画 */

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.25s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ===== 缩放控制 ===== */

.zoom-controls {
  position: absolute;
  left: 16px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;
  color: #f59e0b;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  transform: scale(1.05);
}

/* ===== 底部操作按钮 ===== */

.map-actions {
  position: absolute;
  right: 16px;
  bottom: 12px;
  display: flex;
  gap: 8px;
  z-index: 12;
}

.action-btn {
  padding: 7px 18px;
  background: rgba(15, 23, 42, .88);
  border: 1px solid rgba(59, 130, 246, .25);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(6px);
}

.action-btn:hover {
  background: rgba(59, 130, 246, .15);
  border-color: rgba(59, 130, 246, .5);
  color: #60a5fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(59, 130, 246, .2);
}

.action-btn--active {
  background: linear-gradient(135deg, rgba(47, 111, 159, .18), rgba(59, 130, 246, .18));
  border-color: rgba(47, 111, 159, .5);
  color: #2F6F9F;
  box-shadow:
    0 0 12px rgba(47, 111, 159, .25),
    inset 0 1px 0 rgba(255,255,255,.08);
}

/* ===== 返回省级地图按钮 ===== */

.back-to-province-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(251, 191, 36, 0.85));
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(245, 158, 11, 0.4),
    0 0 20px rgba(245, 158, 11, 0.15);
  backdrop-filter: blur(8px);
}

.back-to-province-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(252, 211, 77, 0.9));
  box-shadow:
    0 8px 24px rgba(245, 158, 11, 0.5),
    0 0 30px rgba(245, 158, 11, 0.2);
}

.back-to-province-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.back-to-province-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-btn-icon {
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.back-btn-text {
  letter-spacing: 0.5px;
}

/* 返回按钮过渡动画 */
.back-btn-fade-enter-active,
.back-btn-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn-fade-enter-from,
.back-btn-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ===== 面包屑导航 ===== */

.breadcrumb-navigation {
  position: absolute;
  top: 16px;
  left: 180px; /* 在返回按钮右侧 */
  z-index: 19;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.breadcrumb-item {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: default;
  white-space: nowrap;
}

.breadcrumb-item--clickable {
  color: #e2e8f0;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.breadcrumb-item--clickable:hover {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
}

.breadcrumb-item--current {
  color: #fbbf24;
  font-weight: 700;
  font-size: 14px;
}

.breadcrumb-separator {
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
  user-select: none;
}

/* 操作提示 */
.breadcrumb-hint {
  margin-left: 12px;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: #34d399;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.15), inset 0 0 8px rgba(16, 185, 129, 0.05);
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

/* ===== 城市地图加载状态 ===== */

.city-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92));
  border-radius: var(--radius-lg, 12px);
  z-index: 15;
  backdrop-filter: blur(12px);
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: all 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* ===== 响应式适配 ===== */

/* 中等屏幕（1366-1600px） */
@media (max-width: 1480px) {
  .map-toolbar {
    top: 10px;
    right: 10px;
    gap: 4px;
  }

  .tool-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .zoom-controls {
    left: 10px;
    bottom: 70px;
  }

  .zoom-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .breadcrumb-navigation {
    padding: 6px 12px;
    left: 170px;
  }

  .breadcrumb-item {
    font-size: 12px;
  }
}

/* 小屏幕（<1366px），进一步缩小 */
@media (max-width: 1280px) {
  .map-toolbar {
    top: 8px;
    right: 8px;
    gap: 2px;
  }

  .tool-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .toolbar-divider {
    height: 18px;
    margin: 0 4px;
  }

  .mode-switch-btn {
    padding: 0 8px;
  }

  .mode-switch-btn .mode-label {
    font-size: 10px;
  }

  .zoom-btn {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }

  .zoom-controls {
    gap: 4px;
  }

  .back-to-province-btn {
    padding: 8px 14px;
    font-size: 12px;
    border-radius: 8px;
    top: 10px;
    left: 10px;
  }

  .breadcrumb-navigation {
    padding: 5px 10px;
    left: 130px;
    gap: 4px;
    border-radius: 8px;
  }

  .breadcrumb-item {
    font-size: 11px;
  }

  .breadcrumb-item--current {
    font-size: 12px;
  }

  .breadcrumb-separator {
    font-size: 12px;
  }

  .breadcrumb-hint {
    font-size: 10px;
    padding: 3px 8px;
  }
}

/* ===== 交互提示（单击/双击引导） ===== */

.map-interaction-hint {
  position: absolute;
  left: 16px;
  bottom: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, .88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, .2);
  border-radius: 8px;
  font-size: 11px;
  color: #94a3b8;
  z-index: 12;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .35);
  user-select: none;
}

.hint-icon {
  font-size: 13px;
}

.hint-text {
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ===== 错误提示 toast ===== */
.map-toast {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(127, 29, 29, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  font-size: 13px;
  color: #fca5a5;
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.toast-icon { font-size: 15px; }
.toast-text { font-weight: 500; }

.hint-text:first-of-type {
  color: #60a5fa;
}

.hint-text:last-of-type {
  color: #fbbf24;
}

.hint-divider {
  color: rgba(148, 163, 184, .3);
  font-weight: 300;
}

/* 提示淡入淡出过渡 */
.hint-fade-enter-active { transition: all 0.4s ease; }
.hint-fade-leave-active { transition: all 0.6s ease; }
.hint-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ★ 站点模式：点击弹窗样式 */
.station-click-tip {
  position: absolute;
  z-index: 50;
  min-width: 180px;
  background: rgba(8, 16, 30, 0.96);
  border: 1px solid rgba(100, 180, 240, 0.35);
  border-radius: 10px;
  padding: 10px 14px 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(52, 211, 153, 0.1);
  pointer-events: auto;
}
.sct-title {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(100, 180, 240, 0.15);
}
.sct-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #94a3b8;
}
.sct-dot { color: #7dd3fc; }
.sct-label { color: #94a3b8; }
.sct-val { color: #fbbf24; font-weight: 500; }
.sct-close {
  position: absolute;
  top: 4px; right: 6px;
  width: 20px; height: 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  border-radius: 4px;
}
.sct-close:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* 站点弹窗过渡 */
.station-tip-fade-enter-active { transition: all 0.2s ease; }
.station-tip-fade-leave-active { transition: all 0.15s ease; }
.station-tip-fade-enter-from { opacity: 0; transform: scale(0.9); }
.station-tip-fade-leave-to { opacity: 0; transform: scale(0.95); }

</style>
