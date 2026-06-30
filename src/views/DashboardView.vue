<template>
  <div class="fullscreen-dashboard" :class="{ 'fullscreen-dashboard--loading': loading }">
    <!-- ===== 全屏背景效果 ===== -->
    <div class="fs-bg">
      <div class="fs-bg__grid"></div>
      <div class="fs-bg__particles"></div>
      <div class="fs-bg__vignette"></div>
    </div>

    <!-- ===== 顶部导航栏 ===== -->
    <PageHeader
      active-nav="首页"
      current-page="dashboard"
      :show-extra-actions="true"
    />

    <!-- ===== 主内容区域 ===== -->
    <main class="fs-main">
      <LoadingSpinner v-if="loading" size="large" text="加载指挥大屏..." :overlay="true" :skeleton="true" />

      <div v-else-if="error" class="fs-error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="retry" class="retry-btn">重新加载</button>
      </div>

      <div v-else class="fs-grid">
        <!-- ===== 左列：行政区 + 灯诱/性诱图表 ===== -->
        <section class="fs-panel fs-panel--left">
          <LeftPanelPrototype
            @region-change="handleRegionChange"
            @region-select="handleRegionSelect"
          />
        </section>

        <!-- ===== 中列：地图 + 农田主墒/苗情 ===== -->
        <section class="fs-panel fs-panel--center" @click.self="clearActiveMarker">
          <!-- 地图标题栏 -->
          <div class="center-header">
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
          <!-- 地图内容 - 使用 CenterMap 组件 -->
          <div class="map-card">
            <CenterMap
              :cities-data="mapCitiesData"
              map-mode="scatter"
              :show-toolbar="false"
              :show-legend="true"
              :show-zoom-controls="false"
              :show-actions="true"
              :show-interaction-hint="false"
              map-title=""
              theme-color="#00D4AA"
              height="100%"
              @city-click="handleMapCityClick"
            />
          </div>
          <!-- 农田主墒/苗情 -->
          <BaseCard title="农田主墒/苗情" size="sm" class="field-card">
            <div class="field-grid">
              <div
                v-for="(img, i) in fieldImages"
                :key="i"
                class="field-img"
                :class="{ 'field-img--active': activeFieldImage === i }"
                @click="handleFieldImageClick(i)"
                @mouseenter="activeFieldImage = i"
                @mouseleave="activeFieldImage = null"
              >
                <img :src="img.src" :alt="img.label" class="field-img__photo" />
                <div class="field-img__overlay"></div>
                <div class="field-img__border"></div>
                <span class="field-img__label">{{ img.label }}</span>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- ===== 右列：工程成果 + 测报灯 + 多光谱 ===== -->
        <section class="fs-panel fs-panel--right">
          <RightPanelPrototype
            @gauge-click="handleGaugeClick"
            @image-click="handleImageClick"
          />
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
import LeftPanelPrototype from '@/components/business/LeftPanelPrototype.vue'
import RightPanelPrototype from '@/components/business/RightPanelPrototype.vue'
import CenterMap from '@/components/business/CenterMap.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
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
const activePest = ref('bollworm')
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

// ===== 悬停提示 =====
const hoverTooltip = ref({ show: false, x: 0, y: 0, title: '', content: '' })

// ===== 配置数据 =====
const pestTabs = [
  { key: 'bollworm', label: '棉铃虫' },
  { key: 'corn_borer', label: '玉米螟' },
  { key: 'locust', label: '蝗虫' }
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

// 地图城市数据（按虫种区分，供 CenterMap 使用）
const pestCitiesData: Record<string, { name: string; value: number; percentage: number }[]> = {
  bollworm: [
    { name: '德州市', value: 25, percentage: 25 },
    { name: '滨州市', value: 35, percentage: 35 },
    { name: '东营市', value: 30, percentage: 30 },
    { name: '济南市', value: 65, percentage: 65 },
    { name: '淄博市', value: 45, percentage: 45 },
    { name: '潍坊市', value: 55, percentage: 55 },
    { name: '烟台市', value: 70, percentage: 70 },
    { name: '威海市', value: 60, percentage: 60 },
    { name: '青岛市', value: 85, percentage: 85 },
    { name: '日照市', value: 40, percentage: 40 },
    { name: '泰安市', value: 50, percentage: 50 },
    { name: '莱芜市', value: 35, percentage: 35 },
    { name: '济宁市', value: 55, percentage: 55 },
    { name: '临沂市', value: 75, percentage: 75 },
    { name: '枣庄市', value: 45, percentage: 45 },
    { name: '菏泽市', value: 50, percentage: 50 },
    { name: '聊城市', value: 40, percentage: 40 }
  ],
  corn_borer: [
    // 玉米螟主要分布在鲁北/鲁中玉米种植带，数值更高
    { name: '德州市', value: 78, percentage: 78 },
    { name: '滨州市', value: 65, percentage: 65 },
    { name: '东营市', value: 42, percentage: 42 },
    { name: '济南市', value: 55, percentage: 55 },
    { name: '淄博市', value: 70, percentage: 70 },
    { name: '潍坊市', value: 88, percentage: 88 },
    { name: '烟台市', value: 50, percentage: 50 },
    { name: '威海市', value: 35, percentage: 35 },
    { name: '青岛市', value: 45, percentage: 45 },
    { name: '日照市', value: 38, percentage: 38 },
    { name: '泰安市', value: 72, percentage: 72 },
    { name: '莱芜市', value: 60, percentage: 60 },
    { name: '济宁市', value: 58, percentage: 58 },
    { name: '临沂市', value: 40, percentage: 40 },
    { name: '枣庄市', value: 32, percentage: 32 },
    { name: '菏泽市', value: 48, percentage: 48 },
    { name: '聊城市', value: 75, percentage: 75 }
  ],
  locust: [
    // 蝗虫主要分布在鲁东沿海及黄河三角洲，数值更高
    { name: '德州市', value: 30, percentage: 30 },
    { name: '滨州市', value: 55, percentage: 55 },
    { name: '东营市', value: 82, percentage: 82 },
    { name: '济南市', value: 25, percentage: 25 },
    { name: '淄博市', value: 35, percentage: 35 },
    { name: '潍坊市', value: 65, percentage: 65 },
    { name: '烟台市', value: 70, percentage: 70 },
    { name: '威海市', value: 58, percentage: 58 },
    { name: '青岛市', value: 75, percentage: 75 },
    { name: '日照市', value: 50, percentage: 50 },
    { name: '泰安市', value: 20, percentage: 20 },
    { name: '莱芜市', value: 18, percentage: 18 },
    { name: '济宁市', value: 28, percentage: 28 },
    { name: '临沂市', value: 40, percentage: 40 },
    { name: '枣庄市', value: 22, percentage: 22 },
    { name: '菏泽市', value: 35, percentage: 35 },
    { name: '聊城市', value: 25, percentage: 25 }
  ]
}

const mapCitiesData = computed(() => pestCitiesData[activePest.value] || pestCitiesData['bollworm'])

const trendGauges = computed(() => [
  { city: '济南市', value: 20, color: '#00d4aa' },
  { city: '青岛市', value: 20, color: '#ff4757' },
  { city: '烟台市', value: 20, color: '#ff8c00' }
])

const trendMonths = computed(() => ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'])

const pestSeriesMap: Record<string, typeof daoyouSeries.value> = {
  bollworm: [
    { name: '棉铃虫', data: [120,150,200,280,350,320,280,240,200,170,140,120] },
    { name: '玉米螟', data: [80,110,160,220,290,260,230,190,160,130,110,90] },
    { name: '蝗虫', data: [60,90,130,180,240,210,180,150,120,100,80,65] }
  ],
  corn_borer: [
    { name: '玉米螟成虫', data: [40,60,90,140,180,160,140,120,100,80,60,45] },
    { name: '玉米螟幼虫', data: [30,45,70,100,130,115,95,80,65,50,40,30] },
    { name: '卵块密度', data: [20,30,50,75,100,90,75,60,50,40,30,25] }
  ],
  locust: [
    { name: '东亚飞蝗', data: [80,120,180,250,320,290,250,200,160,130,100,80] },
    { name: '亚洲飞蝗', data: [60,90,140,200,260,230,190,150,120,95,75,60] },
    { name: '土蝗', data: [40,60,90,130,170,150,125,100,80,65,50,40] }
  ]
}

const daoyouSeries = computed(() => pestSeriesMap['bollworm'])
const currentPestSeries = computed(() => pestSeriesMap[activePest.value] || pestSeriesMap['bollworm'])

const fieldImages = computed(() => [
  { label: '北部区域', src: '/images/field-north.jpg' },
  { label: '中部区域', src: '/images/field-center.jpg' },
  { label: '南部区域', src: '/images/field-south.jpg' }
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

function handleRegionChange(data: any) {
  console.log('[BigScreen] 区域变化:', data)
}

function handleRegionSelect(data: any) {
  console.log('[BigScreen] 区域选择:', data)
}

function handleVideoClick(video: any) {
  console.log('[BigScreen] 视频点击:', video.title)
}

function handleViewAll() {
  console.log('[BigScreen] 查看全部监控')
}

function handleFieldImageClick(index: number) {
  console.log('[BigScreen] 点击图像:', fieldImages.value[index].label)
}

function handleMapCityClick(cityData: any) {
  console.log('[BigScreen] 点击城市:', cityData.name)
  detailTitle.value = `${cityData.name}基础种植情况`
  modalType.value = 'region'
  selectedRegionData.value = {
    name: cityData.name,
    occurrenceArea: cityData.value > 50 ? '33440' : '12580',
    controlArea: cityData.value > 50 ? '26300' : '9800',
    monitoringPoints: cityData.value > 50 ? '4' : '2',
    damageRate: cityData.value > 50 ? '57' : '28'
  }
  showDetailModal.value = true
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
  fetchData()
  
  setTimeout(() => {
    markersAnimated.value = true
  }, 500)
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
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
    linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(192, 132, 252, 0.03) 1px, transparent 1px);
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
    radial-gradient(ellipse 800px 500px at 20% 50%, rgba(0, 212, 170, 0.05) 0%, transparent 70%),
    radial-gradient(ellipse 600px 400px at 80% 20%, rgba(192, 132, 252, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 500px 600px at 60% 80%, rgba(0, 212, 170, 0.03) 0%, transparent 70%);
}
.fs-bg__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(11, 17, 32, 0.5) 100%);
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
  color: #EF4444;
}
.error-icon { font-size: 64px; opacity: 0.6; }
.retry-btn {
  padding: 12px 36px;
  background: linear-gradient(135deg, #00D4AA, #C084FC);
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
  box-shadow: 0 6px 20px rgba(0, 212, 170, 0.4);
}

/* ===== 全屏网格布局 - 原型图：三列等高，无底部区域 ===== */
.fs-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  grid-template-rows: 1fr;
  gap: 14px;
  height: 100%;
  max-height: calc(100vh - 86px);
}

.fs-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(0, 212, 170, 0.12);
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}
.fs-panel:hover {
  border-color: rgba(0, 212, 170, 0.25);
  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.1);
}

/* 面板位置 - 原型图布局 */
.fs-panel--left {
  grid-column: 1;
  grid-row: 1;
  min-width: 280px;
  overflow: hidden;
}
.fs-panel--center {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.fs-panel--center .center-header {
  flex-shrink: 0;
  text-align: center;
  padding: 8px 0;
}
.fs-panel--center .map-card {
  flex: 1;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}
.fs-panel--center .field-card {
  flex-shrink: 0;
  height: 160px;
  min-height: 160px;
  max-height: 160px;
  margin-top: 10px;
  overflow: hidden;
}
.fs-panel--right {
  grid-column: 3;
  grid-row: 1;
  min-width: 300px;
  overflow: hidden;
}

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
  background: linear-gradient(90deg, transparent, #00D4AA, transparent);
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
  background: linear-gradient(135deg, #00D4AA, #C084FC);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.pest-tab:hover::before { opacity: 0.08; }
.pest-tab:hover {
  color: #fff;
  border-color: rgba(0, 212, 170, 0.3);
  transform: translateY(-1px);
}
.pest-tab--active {
  color: #fff !important;
  background: linear-gradient(135deg, #00D4AA, #0D9488) !important;
  border-color: #00D4AA !important;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(0, 212, 170, 0.4);
  z-index: 1;
}
.pest-tab--active::before { opacity: 0; }

.map-title {
  font-size: 20px;
  color: #BAE6FD;
  margin: 0;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(186, 230, 253, 0.3);
}

/* ===== 精简时间选择器 ===== */
.time-selectors-compact {
  display: flex;
  gap: 8px;
  align-items: center;
}
.time-select-sm {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 16px;
  color: #fff;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}
.time-select-sm:hover {
  border-color: #00D4AA;
  box-shadow: 0 0 10px rgba(0, 212, 170, 0.2);
}
.time-select-sm option {
  background: #0F172A;
  color: #fff;
}

.refresh-btn-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 212, 170, 0.1);
  border: 1px solid rgba(0, 212, 170, 0.3);
  color: #00D4AA;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.25s ease;
}
.refresh-btn-sm:hover:not(:disabled) {
  background: rgba(0, 212, 170, 0.2);
  transform: rotate(180deg);
}
.refresh-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 地图容器 ===== */
.map-container {
  width: 100%;
  height: 100%;
  min-height: 280px;
  position: relative;
}
.map-placeholder {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 58% 62%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 78% 33%, rgba(192, 132, 252, 0.06) 0%, transparent 40%),
    radial-gradient(ellipse at 52% 75%, rgba(0, 212, 170, 0.06) 0%, transparent 40%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(0, 212, 170, 0.03));
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
  background: rgba(0, 212, 170, 0.9);
  box-shadow: 0 0 12px rgba(0, 212, 170, 0.5);
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
  box-shadow: 0 0 24px rgba(0, 212, 170, 0.9) !important;
}
.map-marker--hot {
  background: linear-gradient(135deg, #00D4AA, #C084FC) !important;
  box-shadow: 0 0 16px rgba(0, 212, 170, 0.6) !important;
  font-size: 14px !important;
  padding: 5px 11px !important;
}
.map-marker--hot:hover,
.map-marker--hot.map-marker--hovered {
  box-shadow: 0 0 28px rgba(0, 212, 170, 1) !important;
}
.map-marker--active {
  box-shadow: 0 0 24px rgba(0, 212, 170, 0.9) !important;
  transform: translate(-50%, -50%) scale(1.08) !important;
}

/* ===== 地图图例 ===== */
.map-legend {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 20px;
  background: rgba(11, 17, 32, 0.9);
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 212, 170, 0.2);
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
.legend-dot--hot { background: linear-gradient(135deg, #00D4AA, #C084FC); }
.legend-dot--normal { background: rgba(0, 212, 170, 0.9); }

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

/* ===== 农田主墒/苗情 - 科技边框监控画面 ===== */
.field-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  height: 100%;
}
.field-img {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  aspect-ratio: 16/9;
}
.field-img__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.field-img__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}
/* 科技边框 - 四角 */
.field-img__border {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(0, 212, 170, 0.3);
}
.field-img__border::before,
.field-img__border::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: #00D4AA;
  border-style: solid;
  pointer-events: none;
}
.field-img__border::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}
.field-img__border::after {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}
.field-img::before,
.field-img::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: #00D4AA;
  border-style: solid;
  pointer-events: none;
  z-index: 2;
}
.field-img::before {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}
.field-img::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}
.field-img:hover,
.field-img--active {
  transform: scale(1.03);
  box-shadow: 0 0 16px rgba(0, 212, 170, 0.3);
}
.field-img:hover .field-img__border,
.field-img--active .field-img__border {
  border-color: rgba(0, 212, 170, 0.6);
}
.field-img__label {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  padding: 2px 8px;
  background: rgba(0, 212, 170, 0.2);
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
}

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
.brand-item:hover { background: rgba(0, 212, 170, 0.08); }
.brand-name { color: rgba(255,255,255,0.8); white-space: nowrap; }
.brand-count { color: rgba(255,255,255,0.5); }
.brand-ratio { font-weight: bold; text-align: right; }
.ratio-high { color: #00D4AA; }
.ratio-mid { color: #C084FC; }
.ratio-low { color: #EF4444; }
.brand-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.brand-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00D4AA, #C084FC);
  border-radius: 2px;
  transition: width 0.6s ease;
}
.brand-bar-fill--active { box-shadow: 0 0 10px rgba(0, 212, 170, 0.5); }

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
  border: 1px solid rgba(0, 212, 170, 0.15);
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
.summary-value--danger { color: #EF4444; }
.summary-value--success { color: #00D4AA; }
.summary-value--warning { color: #C084FC; }

.brand-detail .brand-info { padding: 20px; }
.brand-info h4 { margin: 0 0 16px 0; color: #fff; font-size: 18px; }
.brand-info p { margin: 10px 0; color: rgba(255,255,255,0.6); }

/* ===== 悬停提示 ===== */
.hover-tooltip {
  position: fixed;
  background: rgba(11, 17, 32, 0.97);
  border: 1px solid rgba(0, 212, 170, 0.3);
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
  border-bottom: 1px solid rgba(0, 212, 170, 0.15);
}
.fs-panel :deep(.base-card--size-sm .base-card__title) {
  font-size: 13px;
  color: #BAE6FD;
  font-weight: 600;
  letter-spacing: 1px;
}
.fs-panel :deep(.base-card--size-sm .base-card__body) {
  padding: 12px;
}

/* ===== 响应式适配 ===== */
@media (max-width: 1920px) {
  .fs-grid { grid-template-columns: 260px 1fr 280px; gap: 12px; }
  .map-title { font-size: 18px; }
}

@media (max-width: 1600px) {
  .fs-grid { grid-template-columns: 240px 1fr 260px; gap: 10px; }
  .fs-main { padding: 12px 18px 16px; }
}

@media (max-width: 1366px) {
  .fs-grid {
    grid-template-columns: 220px 1fr 240px;
    gap: 8px;
  }
}

/* ===== 加载状态动画 ===== */
.fullscreen-dashboard--loading::before {
  content: '';
  position: fixed;
  inset: 0;
  background: #0B1120;
  z-index: 10000;
  animation: fadeOutLoading 0.5s ease-out 0.8s forwards;
}
@keyframes fadeOutLoading {
  to { opacity: 0; pointer-events: none; }
}
</style>