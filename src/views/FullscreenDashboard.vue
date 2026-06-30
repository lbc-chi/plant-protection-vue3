<template>
  <div class="fullscreen-dashboard" :class="{ 'fullscreen-dashboard--loading': loading }">
    <!-- ===== 全屏背景效果 ===== -->
    <div class="fs-bg">
      <div class="fs-bg__grid"></div>
      <div class="fs-bg__particles"></div>
      <div class="fs-bg__vignette"></div>
    </div>

    <!-- ===== 顶部标题栏（精简版） ===== -->
    <header class="fs-header">
      <div class="fs-header__left">
        <h1 class="fs-header__title">
          <span class="title-icon">🌾</span>
          山东省智慧植保综合指挥平台
        </h1>
        <span class="fs-header__subtitle">Shandong Smart Plant Protection Command Platform</span>
      </div>

      <div class="fs-header__center">
        <div class="datetime-display">
          <span class="date">{{ currentDate }}</span>
          <span class="time">{{ currentTime }}</span>
        </div>
      </div>

      <div class="fs-header__right">
        <div class="weather-info">
          <span class="weather-icon">☀️</span>
          <span>17~26°C 晴</span>
          <span class="location">山东省</span>
        </div>
        <button 
          class="exit-fullscreen-btn"
          @click="exitFullscreen"
          title="退出全屏"
        >
          ⛶ 退出
        </button>
      </div>
    </header>

    <!-- ===== 主内容区域（100%屏幕空间） ===== -->
    <main class="fs-main">
      <LoadingSpinner v-if="loading" size="large" text="加载指挥大屏..." :overlay="true" :skeleton="true" />

      <div v-else-if="error" class="fs-error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="retry" class="retry-btn">重新加载</button>
      </div>

      <div v-else class="fs-grid">
        <!-- ===== 第一行：左上/中/右 ===== -->
        
        <!-- 左上：走廊数据采集概览 -->
        <section class="fs-panel fs-panel--tl">
          <RightPanelPrototype
            @gauge-click="handleGaugeClick"
            @image-click="handleImageClick"
          />
        </section>

        <!-- 中上：虫害Tab + 地图标题 -->
        <section class="fs-panel fs-panel--tc">
          <div class="panel-header">
            <nav class="pest-tabs" :class="{ 'pest-tabs--transitioning': isTransitioning }">
              <button
                v-for="tab in pestTabs"
                :key="tab.key"
                class="pest-tab"
                :class="{ 'pest-tab--active': activePest === tab.key }"
                @click="handlePestTabClick(tab.key)"
              >{{ tab.label }}</button>
            </nav>
            <h2 class="map-title">{{ mapTitle }}</h2>
          </div>
        </section>

        <!-- 右上：时间选择器 -->
        <section class="fs-panel fs-panel--tr">
          <div class="time-selectors-compact">
            <select v-model="selectedYear" @change="handleTimeChange" class="time-select-sm">
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
            </select>
            <select v-model="selectedMonth" @change="handleTimeChange" class="time-select-sm">
              <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}月</option>
            </select>
            <button class="refresh-btn-sm" @click="refreshData" :disabled="isRefreshing">
              {{ isRefreshing ? '⏳' : '↻' }}
            </button>
          </div>
        </section>

        <!-- ===== 第二行：左/中/右 ===== -->

        <!-- 左中：历史趋势分析 -->
        <section class="fs-panel fs-panel--ml">
          <BaseCard title="走廊测报设备类型分析" size="sm">
            <LineChart
              :x-axis-data="historyMonths"
              :series="historySeries"
              :smooth="true"
              :show-tooltip="true"
              height="220px"
              @chart-click="handleChartClick"
            />
          </BaseCard>
        </section>

        <!-- 中央：地图区域（核心焦点 - 占据最大空间） -->
        <section class="fs-panel fs-panel--center" @click.self="clearActiveMarker">
          <BaseCard title="" :bordered="false" :paddingless="true">
            <div class="map-container" ref="mapContainerRef">
              <div class="map-placeholder">
                <div class="map-placeholder__content">
                  <div class="map-markers">
                    <div
                      v-for="(marker, idx) in mapMarkers"
                      :key="marker.name"
                      class="map-marker"
                      :class="{ 
                        'map-marker--hot': marker.hot,
                        'map-marker--active': activeMarker?.name === marker.name,
                        'map-marker--hovered': hoveredMarker?.name === marker.name,
                        'map-marker--animated': markersAnimated
                      }"
                      :style="{ 
                        left: marker.x + '%', 
                        top: marker.y + '%',
                        animationDelay: (idx * 0.06) + 's'
                      }"
                      @click.stop="handleMarkerClick(marker)"
                      @mouseenter="handleMarkerHover(marker, true)"
                      @mouseleave="handleMarkerHover(marker, false)"
                    >{{ marker.value }}</div>
                  </div>
                  <div class="map-legend">
                    <span class="legend-item"><span class="legend-dot legend-dot--hot"></span>高发区域</span>
                    <span class="legend-item"><span class="legend-dot legend-dot--normal"></span>正常区域</span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- 右中：站点新增趋势 -->
        <section class="fs-panel fs-panel--mr">
          <BaseCard title="站点新增趋势（对比上一年）" size="sm">
            <div class="gauge-row">
              <div 
                v-for="g in trendGauges" 
                :key="g.city" 
                class="mini-gauge"
                @click="handleGaugeClick(g.city)"
              >
                <div class="mini-gauge__city">{{ g.city }}</div>
                <div class="mini-gauge__value" :style="{ color: g.color }">{{ g.value }}%</div>
                <div class="mini-gauge__bar">
                  <div class="mini-gauge__fill" :style="{ width: g.value + '%', background: g.color }"></div>
                </div>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- ===== 第三行：左下/中下/右下 ===== -->

        <!-- 左下：打诱虫量趋势 -->
        <section class="fs-panel fs-panel--bl">
          <BaseCard title="全省主要害虫趋势(打诱)" size="sm">
            <LineChart
              :x-axis-data="trendMonths"
              :series="currentPestSeries"
              :smooth="true"
              :show-tooltip="true"
              height="200px"
              @chart-click="handlePestChartClick"
            />
          </BaseCard>
        </section>

        <!-- 中下：农田主墒/图像 -->
        <section class="fs-panel fs-panel--bc">
          <BaseCard title="农田主墒/图像" size="sm">
            <div class="image-grid">
              <div 
                v-for="(img, i) in fieldImages" 
                :key="i" 
                class="field-img"
                :class="{ 'field-img--active': activeFieldImage === i }"
                @click="handleFieldImageClick(i)"
                @mouseenter="activeFieldImage = i"
                @mouseleave="activeFieldImage = null"
              >
                <span class="field-img__icon">📹</span>
                <span class="field-img__label">{{ img.label }}</span>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- 右下：设备品牌分析 -->
        <section class="fs-panel fs-panel--br">
          <BaseCard title="设备品牌分析" size="sm">
            <div class="brand-list">
              <div 
                v-for="b in brandData" 
                :key="b.name" 
                class="brand-item"
                @click="handleBrandClick(b)"
                @mouseenter="activeBrand = b.name"
                @mouseleave="activeBrand = null"
              >
                <span class="brand-name">{{ b.icon }} {{ b.name }}</span>
                <span class="brand-count">{{ b.count }}</span>
                <span class="brand-ratio" :class="getRatioClass(b.ratio)">{{ b.ratio }}%</span>
                <div class="brand-bar">
                  <div class="brand-bar-fill" :style="{ width: b.ratio + '%' }" :class="{ 'brand-bar-fill--active': activeBrand === b.name }"></div>
                </div>
              </div>
            </div>
          </BaseCard>
        </section>
      </div>
    </main>

    <!-- ===== 数据详情弹窗 ===== -->
    <Modal
      v-model="showDetailModal"
      :title="detailTitle"
      width="680px"
      :draggable="true"
      :footer="false"
      @close="handleModalClose"
    >
      <div class="modal-content">
        <div v-if="modalType === 'region'" class="region-detail">
          <div class="region-summary">
            <div class="summary-item">
              <span class="summary-label">发生面积</span>
              <span class="summary-value summary-value--danger">{{ selectedRegionData?.occurrenceArea || '33440' }}亩</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">防治面积</span>
              <span class="summary-value summary-value--success">{{ selectedRegionData?.controlArea || '26300' }}亩</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">监测点数</span>
              <span class="summary-value">{{ selectedRegionData?.monitoringPoints || '4' }}个</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均危害率</span>
              <span class="summary-value summary-value--warning">{{ selectedRegionData?.damageRate || '57' }}%</span>
            </div>
          </div>
          <DataTable
            :columns="modalColumns"
            :data="modalData"
            :loading="false"
            :pagination="modalPagination"
            stripe
            border
            @row-click="handleTableRowClick"
          />
        </div>
        <div v-else-if="modalType === 'brand'" class="brand-detail">
          <div class="brand-info">
            <h4>{{ selectedBrand?.icon }} {{ selectedBrand?.name }}</h4>
            <p>设备数量：{{ selectedBrand?.count }}台</p>
            <p>市场占比：{{ selectedBrand?.ratio }}%</p>
            <p>不良率：{{ (Math.random() * 5).toFixed(1) }}%</p>
          </div>
        </div>
      </div>
    </Modal>

    <!-- ===== 悬停提示卡片 ===== -->
    <Transition name="tooltip-fade">
      <div 
        v-if="hoverTooltip.show" 
        class="hover-tooltip"
        :style="{ left: hoverTooltip.x + 'px', top: hoverTooltip.y + 'px' }"
      >
        <div class="hover-tooltip__title">{{ hoverTooltip.title }}</div>
        <div class="hover-tooltip__content">{{ hoverTooltip.content }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useDeviceStore } from '@/store/useDeviceStore'
import RightPanelPrototype from '@/components/business/RightPanelPrototype.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataTable from '@/components/ui/DataTable.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Modal from '@/components/ui/Modal.vue'

const router = useRouter()
const dashboardStore = useDashboardStore()
const deviceStore = useDeviceStore()

// ===== 状态管理 =====
const loading = ref(true)
const error = ref<string | null>(null)
const isRefreshing = ref(false)
const activePest = ref('zhibao')
const selectedYear = ref(2024)
const selectedMonth = ref(10)
const isTransitioning = ref(false)
const lastFilterChange = ref<Date | null>(null)
const showDetailModal = ref(false)
const detailTitle = ref('')
const modalType = ref<'region' | 'brand'>('region')
const activeMarker = ref<typeof mapMarkers.value[0] | null>(null)
const activeFieldImage = ref<number | null>(null)
const activeBrand = ref<string | null>(null)
const selectedRegionData = ref<Record<string, string | number> | null>(null)
const selectedBrand = ref<typeof brandData.value[0] | null>(null)
const hoveredMarker = ref<typeof mapMarkers.value[0] | null>(null)
const markersAnimated = ref(false)

// ===== 时间显示 =====
const currentDate = ref('')
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateDateTime() {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ===== 悬停提示 =====
const hoverTooltip = ref({ show: false, x: 0, y: 0, title: '', content: '' })

// ===== 配置数据 =====
const pestTabs = [
  { key: 'zhibao', label: '植保虫' },
  { key: 'yumisong', label: '玉米螟' },
  { key: 'yachong', label: '蚜虫' }
]

const yearOptions = [2024, 2023, 2022]
const monthOptions = [10, 9, 8, 7]

// ===== 计算属性 =====
const mapTitle = computed(() => `山东省${selectedYear.value}年度新增站点分布图`)

const historyMonths = computed(() => ['2018','2019','2020','2021','2022','2023','2024'])
const historySeries = computed(() => [
  { name: '气象数据源', data: [20,25,18,30,28,35,40] },
  { name: '图像数据源', data: [15,22,16,26,24,32,38] },
  { name: '虫量数据源', data: [10,18,12,22,20,28,34] }
])

const mapMarkers = computed(() => [
  { name: '青岛市', x: 82, y: 32, value: 365, hot: true },
  { name: '潍坊市', x: 55, y: 48, value: 365 },
  { name: '济南市', x: 42, y: 36, value: 365 },
  { name: '淄博市', x: 50, y: 44, value: 365 },
  { name: '东营市', x: 72, y: 46, value: 365 },
  { name: '烟台市', x: 80, y: 22, value: 365 },
  { name: '威海市', x: 88, y: 20, value: 365 },
  { name: '日照市', x: 78, y: 52, value: 365 },
  { name: '临沂市', x: 58, y: 68, value: 3232, hot: true },
  { name: '济宁市', x: 45, y: 58, value: 3232, hot: true },
  { name: '枣庄市', x: 52, y: 64, value: 3232, hot: true },
  { name: '泰安市', x: 48, y: 48, value: 3232, hot: true },
  { name: '莱芜市', x: 54, y: 42, value: 3232 },
  { name: '德州市', x: 30, y: 28, value: 3232 },
  { name: '滨州市', x: 38, y: 32, value: 3232 },
  { name: '菏泽市', x: 32, y: 70, value: 3232 }
])

const trendGauges = computed(() => [
  { city: '济南市', value: 20, color: '#00d4aa' },
  { city: '青岛市', value: 20, color: '#ff4757' },
  { city: '烟台市', value: 20, color: '#ff8c00' }
])

const trendMonths = computed(() => ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'])

const pestSeriesMap: Record<string, typeof daoyouSeries.value> = {
  zhibao: [
    { name: '粘特生', data: [120,150,200,280,350,320,280,240,200,170,140,120] },
    { name: '玉米螟', data: [80,110,160,220,290,260,230,190,160,130,110,90] },
    { name: '蚜虫', data: [60,90,130,180,240,210,180,150,120,100,80,65] }
  ],
  yumisong: [
    { name: '玉米螟成虫', data: [40,60,90,140,180,160,140,120,100,80,60,45] },
    { name: '玉米螟幼虫', data: [30,45,70,100,130,115,95,80,65,50,40,30] },
    { name: '卵块密度', data: [20,30,50,75,100,90,75,60,50,40,30,25] }
  ],
  yachong: [
    { name: '棉蚜', data: [80,120,180,250,320,290,250,200,160,130,100,80] },
    { name: '麦蚜', data: [60,90,140,200,260,230,190,150,120,95,75,60] },
    { name: '桃蚜', data: [40,60,90,130,170,150,125,100,80,65,50,40] }
  ]
}

const daoyouSeries = computed(() => pestSeriesMap['zhibao'])
const currentPestSeries = computed(() => pestSeriesMap[activePest.value] || pestSeriesMap['zhibao'])

const fieldImages = computed(() => [
  { label: '北部区域' }, { label: '中部区域' }, { label: '南部区域' }
])

const brandData = computed(() => [
  { icon: '🌾', name: '托普云农', count: 90, ratio: 44.2 },
  { icon: '🌾', name: '济南农智', count: 90, ratio: 44.2 },
  { icon: '🌾', name: '济南祥瑞', count: 90, ratio: 44.2 },
  { icon: '🌾', name: '宁波植康', count: 90, ratio: 44.2 }
])

// ===== 模态框数据 =====
const modalColumns = [
  { key: 'index', label: '序号', width: 60 },
  { key: 'district', label: '所属区县', width: 100 },
  { key: 'name', label: '站点名称', width: 180 },
  { key: 'date', label: '建设时间', width: 120 },
  { key: 'location', label: '建设位置' }
]

const modalData = computed(() => {
  const regionName = selectedRegionData.value?.name || '市中区'
  return Array.from({ length: 14 }, (_, i) => ({
    index: i + 1,
    district: regionName,
    name: `${regionName}某某某某站点`,
    date: '2024/12/30',
    location: `${regionName}某某某站点建设位置`
  }))
})

const modalPagination = { current: 1, pageSize: 14, total: 14 }

// ===== 工具函数 =====
function getRatioClass(ratio: number): string {
  if (ratio >= 40) return 'ratio-high'
  if (ratio >= 25) return 'ratio-mid'
  return 'ratio-low'
}

function formatLastChange(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 5) return '✓ 刚刚更新'
  if (diff < 60) return `${diff}秒前更新`
  const minutes = Math.floor(diff / 60)
  if (minutes < 60) return `${minutes}分钟前更新`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前更新`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ===== 交互处理函数 =====
function handlePestTabClick(key: string) {
  if (activePest.value === key) return
  isTransitioning.value = true
  activePest.value = key
  lastFilterChange.value = new Date()
  setTimeout(() => { isTransitioning.value = false }, 300)
}

function handleTimeChange() {
  lastFilterChange.value = new Date()
}

async function refreshData() {
  isRefreshing.value = true
  try {
    await Promise.all([
      dashboardStore.fetchDashboardData(),
      deviceStore.fetchDeviceData()
    ])
  } catch (e) {
    console.error('[BigScreen] 刷新失败:', e)
  } finally {
    isRefreshing.value = false
  }
}

function handleMarkerClick(marker: typeof mapMarkers.value[0]) {
  activeMarker.value = marker
  detailTitle.value = `${marker.name}基础种植情况`
  modalType.value = 'region'
  selectedRegionData.value = {
    name: marker.name,
    occurrenceArea: marker.hot ? '33440' : '12580',
    controlArea: marker.hot ? '26300' : '9800',
    monitoringPoints: marker.hot ? '4' : '2',
    damageRate: marker.hot ? '57' : '28'
  }
  showDetailModal.value = true
}

function handleMarkerHover(marker: typeof mapMarkers.value[0], show: boolean) {
  hoveredMarker.value = show ? marker : null
  
  if (show) {
    const mapRect = mapContainerRef.value?.getBoundingClientRect()
    if (!mapRect) return
    
    const x = (marker.x / 100) * mapRect.width + mapRect.left + 20
    const y = (marker.y / 100) * mapRect.height + mapRect.top - 10
    
    hoverTooltip.value = {
      show: true,
      x: Math.min(x, window.innerWidth - 200),
      y: Math.max(y, 80),
      title: marker.name,
      content: `监测值: ${marker.value}${marker.hot ? ' | ⚠️ 高发区域' : ''}`
    }
  } else {
    hoverTooltip.value.show = false
  }
}

function handleGaugeClick(city: string) {
  const marker = mapMarkers.value.find(m => m.name === city)
  if (marker) handleMarkerClick(marker)
}

function handleImageClick(type: string, image: any, index: number) {
  console.log('[BigScreen] 图片点击:', type, image.label)
}

function handleFieldImageClick(index: number) {
  console.log('[BigScreen] 点击图像:', fieldImages.value[index].label)
}

function handleBrandClick(brand: typeof brandData.value[0]) {
  selectedBrand.value = brand
  detailTitle.value = `${brand.name}设备详情`
  modalType.value = 'brand'
  showDetailModal.value = true
}

function handleChartClick(params: unknown) {
  console.log('[BigScreen] 图表点击:', params)
}

function handlePestChartClick(params: unknown) {
  console.log('[BigScreen] 害虫图表点击:', params)
}

function handleModalClose() {
  showDetailModal.value = false
  activeMarker.value = null
  selectedRegionData.value = null
  selectedBrand.value = null
}

function clearActiveMarker() {
  activeMarker.value = null
}

function handleTableRowClick(row: any) {
  console.log('[BigScreen] 表格行点击:', row)
}

function exitFullscreen() {
  router.push('/')
}

// ===== 数据加载 =====
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([
      dashboardStore.fetchDashboardData(),
      deviceStore.fetchDeviceData()
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function retry() { fetchData() }

// ===== 生命周期 =====
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
  
  fetchData()
  
  setTimeout(() => {
    markersAnimated.value = true
  }, 500)

  // 尝试进入浏览器全屏模式
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch([selectedYear, selectedMonth], () => {
  console.log('[BigScreen] 时间参数变化:', selectedYear.value, selectedMonth.value)
})

watch(activePest, (newPest) => {
  console.log('[BigScreen] 虫害类型切换:', newPest)
})
</script>

<style scoped>
/* ===== 全屏容器 ===== */
.fullscreen-dashboard {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0a1628 0%, #0d1b2a 50%, #0a1929 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

/* ===== 背景效果 ===== */
.fs-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.fs-bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 140, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 140, 0, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: bgPan 30s linear infinite;
}
@keyframes bgPan {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}
.fs-bg__particles {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 800px 500px at 20% 50%, rgba(255, 140, 0, 0.05) 0%, transparent 70%),
    radial-gradient(ellipse 600px 400px at 80% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 500px 600px at 60% 80%, rgba(47, 111, 159, 0.04) 0%, transparent 70%);
}
.fs-bg__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
}

/* ===== 顶部标题栏 ===== */
.fs-header {
  height: 70px;
  min-height: 70px;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 40px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
  background: linear-gradient(180deg, rgba(13, 27, 42, 0.95), rgba(10, 22, 35, 0.85));
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 10;
}
.fs-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary, #ff8c00), transparent);
}

.fs-header__title {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-icon {
  font-size: 32px;
  filter: drop-shadow(0 0 10px rgba(255,215,0,0.5));
}
.fs-header__subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 2px;
  margin-left: 46px;
  text-transform: uppercase;
}

.datetime-display {
  display: flex;
  gap: 16px;
  padding: 8px 24px;
  background: rgba(255,140,0,0.08);
  border-radius: 20px;
  border: 1px solid rgba(255,140,0,0.2);
}
.date {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}
.time {
  font-size: 22px;
  font-weight: 700;
  color: #2F6F9F;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.weather-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  padding: 6px 16px;
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
}
.weather-icon { font-size: 18px; }
.location {
  color: #ff8c00;
  font-weight: 500;
}

.exit-fullscreen-btn {
  margin-left: 16px;
  padding: 6px 18px;
  background: rgba(255,71,87,0.1);
  border: 1px solid rgba(255,71,87,0.3);
  color: #ff4757;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}
.exit-fullscreen-btn:hover {
  background: rgba(255,71,87,0.2);
  transform: translateY(-1px);
}

/* ===== 主内容区 ===== */
.fs-main {
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
  padding: 16px 24px 20px;
}

.fs-error {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #ff4757;
}
.error-icon { font-size: 64px; opacity: 0.6; }
.retry-btn {
  padding: 12px 36px;
  background: linear-gradient(135deg, #ff8c00, #ffd700);
  color: #fff;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.25s ease;
}
.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,140,0,0.4);
}

/* ===== 全屏网格布局 ===== */
.fs-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  height: 100%;
  max-height: calc(100vh - 102px);
}

.fs-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 140, 0, 0.12);
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}
.fs-panel:hover {
  border-color: rgba(255, 140, 0, 0.25);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

/* 面板位置 */
.fs-panel--tl { grid-column: 1; grid-row: 1; }
.fs-panel--tc { grid-column: 2; grid-row: 1; align-items: center; justify-content: center; }
.fs-panel--tr { grid-column: 3; grid-row: 1; align-items: center; justify-content: flex-end; }

.fs-panel--ml { grid-column: 1; grid-row: 2; }
.fs-panel--center { grid-column: 2; grid-row: 2 / 4; }
.fs-panel--mr { grid-column: 3; grid-row: 2; }

.fs-panel--bl { grid-column: 1; grid-row: 3; }
.fs-panel--bc { grid-column: 2; grid-row: 3; }
.fs-panel--br { grid-column: 3; grid-row: 3; }

/* ===== 面板头部样式 ===== */
.panel-header {
  text-align: center;
  width: 100%;
}

.pest-tabs {
  display: inline-flex;
  gap: 3px;
  margin-bottom: 8px;
  position: relative;
}
.pest-tabs--transitioning::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff8c00, transparent);
  animation: tabSlide 0.3s ease-out;
}
@keyframes tabSlide {
  0% { transform: scaleX(0); opacity: 0; }
  100% { transform: scaleX(1); opacity: 1; }
}

.pest-tab {
  padding: 6px 24px;
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.pest-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ff8c00, #ffd700);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.pest-tab:hover::before { opacity: 0.08; }
.pest-tab:hover {
  color: #fff;
  border-color: rgba(255,140,0,0.3);
  transform: translateY(-1px);
}
.pest-tab--active {
  color: #fff !important;
  background: linear-gradient(135deg, #ff8c00, #ff6b00) !important;
  border-color: #ff8c00 !important;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(255,140,0,0.4);
  z-index: 1;
}
.pest-tab--active::before { opacity: 0; }

.map-title {
  font-size: 20px;
  color: #ffd700;
  margin: 0;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(255,215,0,0.3);
}

/* ===== 精简时间选择器 ===== */
.time-selectors-compact {
  display: flex;
  gap: 8px;
  align-items: center;
}
.time-select-sm {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,140,0,0.2);
  border-radius: 16px;
  color: #fff;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}
.time-select-sm:hover {
  border-color: #ff8c00;
  box-shadow: 0 0 10px rgba(255,140,0,0.2);
}
.time-select-sm option {
  background: #1a2332;
  color: #fff;
}

.refresh-btn-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,140,0,0.1);
  border: 1px solid rgba(255,140,0,0.3);
  color: #ff8c00;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.25s ease;
}
.refresh-btn-sm:hover:not(:disabled) {
  background: rgba(255,140,0,0.2);
  transform: rotate(180deg);
}
.refresh-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 地图容器 ===== */
.map-container {
  width: 100%;
  height: 100%;
  min-height: 450px;
  position: relative;
}
.map-placeholder {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 58% 62%, rgba(255,100,50,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 78% 33%, rgba(255,100,50,0.1) 0%, transparent 40%),
    radial-gradient(ellipse at 52% 75%, rgba(255,100,50,0.1) 0%, transparent 40%),
    linear-gradient(135deg, rgba(47, 111, 159,0.02), rgba(0,100,150,0.04));
  border-radius: 8px;
  overflow: hidden;
}
.map-placeholder__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
}

/* ===== 地图标记点 ===== */
.map-markers { position: absolute; inset: 0; }
.map-marker {
  position: absolute;
  transform: translate(-50%, -50%) scale(0);
  padding: 4px 9px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: rgba(47, 111, 159, 0.9);
  box-shadow: 0 0 12px rgba(47, 111, 159,0.5);
  white-space: nowrap;
  z-index: 2;
  opacity: 0;
}
.map-marker--animated {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: markerBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes markerBounceIn {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
.map-marker:hover,
.map-marker--hovered {
  transform: translate(-50%, -50%) scale(1.4) !important;
  z-index: 10 !important;
  box-shadow: 0 0 24px rgba(47, 111, 159,0.9) !important;
}
.map-marker--hot {
  background: linear-gradient(135deg, #ff8c00, #ffd700) !important;
  box-shadow: 0 0 16px rgba(255,140,0,0.6) !important;
  font-size: 14px !important;
  padding: 5px 11px !important;
}
.map-marker--hot:hover,
.map-marker--hot.map-marker--hovered {
  box-shadow: 0 0 28px rgba(255,140,0,1) !important;
}
.map-marker--active {
  box-shadow: 0 0 24px rgba(255,140,0,0.9) !important;
  transform: translate(-50%, -50%) scale(1.08) !important;
}

/* ===== 地图图例 ===== */
.map-legend {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 20px;
  background: rgba(10, 22, 40, 0.9);
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,140,0,0.2);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.legend-dot--hot { background: linear-gradient(135deg, #ff8c00, #ffd700); }
.legend-dot--normal { background: rgba(47, 111, 159, 0.9); }

/* ===== 迷你仪表盘行 ===== */
.gauge-row { display: flex; flex-direction: column; gap: 18px; padding: 10px 0; }
.mini-gauge {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.mini-gauge:hover { background: rgba(255,140,0,0.08); transform: translateX(4px); }
.mini-gauge__city { font-size: 12px; color: rgba(255,255,255,0.6); }
.mini-gauge__value { font-size: 20px; font-weight: bold; text-align: right; }
.mini-gauge__bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
.mini-gauge__fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

/* ===== 图像网格 ===== */
.image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.field-img {
  aspect-ratio: 16/9;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  border: 1px solid rgba(255,140,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.field-img:hover,
.field-img--active {
  border-color: #ff8c00;
  box-shadow: 0 0 20px rgba(255,140,0,0.2);
  transform: scale(1.02);
}
.field-img__icon { font-size: 28px; opacity: 0.5; }
.field-img__label { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; }

/* ===== 品牌列表 ===== */
.brand-list { display: flex; flex-direction: column; gap: 12px; }
.brand-item {
  display: grid;
  grid-template-columns: auto auto auto 1fr;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.brand-item:hover { background: rgba(255,140,0,0.08); }
.brand-name { color: rgba(255,255,255,0.8); white-space: nowrap; }
.brand-count { color: rgba(255,255,255,0.5); }
.brand-ratio { font-weight: bold; text-align: right; }
.ratio-high { color: #00d4aa; }
.ratio-mid { color: #ffd700; }
.ratio-low { color: #ff4757; }
.brand-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.brand-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8c00, #ffd700);
  border-radius: 2px;
  transition: width 0.6s ease;
}
.brand-bar-fill--active { box-shadow: 0 0 10px rgba(255,140,0,0.5); }

/* ===== 模态框内容 ===== */
.modal-content { padding: 8px 0; }
.region-detail .region-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
  background: rgba(255,255,255,0.03);
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255,140,0,0.15);
}
.summary-item { text-align: center; }
.summary-label {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 8px;
}
.summary-value {
  font-size: 22px;
  font-weight: bold;
  color: #fff;
}
.summary-value--danger { color: #ff4757; }
.summary-value--success { color: #00d4aa; }
.summary-value--warning { color: #ffd700; }

.brand-detail .brand-info { padding: 20px; }
.brand-info h4 { margin: 0 0 16px 0; color: #fff; font-size: 18px; }
.brand-info p { margin: 10px 0; color: rgba(255,255,255,0.6); }

/* ===== 悬停提示 ===== */
.hover-tooltip {
  position: fixed;
  background: rgba(10, 22, 40, 0.97);
  border: 1px solid rgba(255,140,0,0.3);
  border-radius: 8px;
  padding: 10px 14px;
  z-index: 10000;
  pointer-events: none;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.hover-tooltip__title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}
.hover-tooltip__content {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ===== BaseCard 样式覆盖 ===== */
.fs-panel :deep(.base-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: none;
}
.fs-panel :deep(.base-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.fs-panel :deep(.base-card--size-sm .base-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,140,0,0.15);
}
.fs-panel :deep(.base-card--size-sm .base-card__title) {
  font-size: 13px;
  color: #ffd700;
  font-weight: 600;
  letter-spacing: 1px;
}
.fs-panel :deep(.base-card--size-sm .base-card__body) {
  padding: 12px;
}

/* ===== 响应式适配 ===== */
@media (max-width: 1920px) {
  .fs-grid { grid-template-columns: 260px 1fr 280px; gap: 12px; }
  .fs-header__title { font-size: 24px; }
  .map-title { font-size: 18px; }
}

@media (max-width: 1600px) {
  .fs-grid { grid-template-columns: 240px 1fr 260px; gap: 10px; }
  .fs-header { padding: 0 30px; height: 60px; }
  .fs-main { padding: 12px 18px 16px; }
}

@media (max-width: 1366px) {
  .fs-grid {
    grid-template-columns: 220px 1fr 240px;
    gap: 8px;
  }
  .fs-header__title { font-size: 20px; }
  .fs-header__subtitle { display: none; }
}

/* ===== 加载状态动画 ===== */
.fullscreen-dashboard--loading::before {
  content: '';
  position: fixed;
  inset: 0;
  background: #0a1628;
  z-index: 10000;
  animation: fadeOutLoading 0.5s ease-out 0.8s forwards;
}
@keyframes fadeOutLoading {
  to { opacity: 0; pointer-events: none; }
}
</style>