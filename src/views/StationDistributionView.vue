<template>
  <div class="station-distribution">
    <!-- 加载状态 -->
    <div v-if="isPageLoading" class="page-loading">
      <div class="loading-spinner"></div>
      <span>正在加载站点分布页面...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="pageError" class="page-error">
      <div class="error-icon">⚠️</div>
      <h3>页面加载失败</h3>
      <p>{{ pageErrorMessage }}</p>
      <button class="retry-btn" @click="retryLoad">重新加载</button>
      <button class="back-btn" @click="$router.push('/')">返回首页</button>
    </div>

    <!-- 正常内容 -->
    <div v-else class="sd-content-wrapper">
      <!-- ===== 顶部导航栏 ===== -->
      <PageHeader
        active-nav="stations"
        current-page="stations"
        :show-extra-actions="false"
        @menu-toggle="toggleMenuDrawer"
      />

      <!-- ===== 主体三栏布局 ===== -->
      <div class="sd-main-body">

        <!-- ==================== 左侧面板 ==================== -->
        <aside class="sd-left-panel animate-fade-in delay-100">
          <!-- 各市站点数量排行 -->
          <section class="sd-card sd-ranking-card">
            <h3 class="sd-card-title">各市站点总量排行</h3>
            <div class="ranking-list">
              <div
                v-for="(city, index) in displayedRankings"
                :key="city.name"
                class="ranking-item"
                :class="{ 'ranking-item--top3': index < 3 }"
              >
                <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
                <span class="rank-city">{{ city.name }}</span>
                <span class="rank-value">（{{ city.stations }}个）</span>
                <div class="rank-bar-wrapper">
                  <div
                    class="rank-bar"
                    :style="{ width: city.percentage + '%' }"
                    :class="`rank-bar--${index < 3 ? 'gold' : 'blue'}`"
                  ></div>
                </div>
                <span class="rank-percent">{{ city.percentage }}%</span>
              </div>
            </div>
            <button class="ranking-expand-btn" @click="toggleRanking">
              {{ rankingExpanded ? '收起 ▲' : `展开全部 (共${cityRankings.length}个) ▼` }}
            </button>
          </section>

          <!-- 主监测设备类型分析 -->
          <section class="sd-chart-card">
            <h3 class="sd-card-title">年度新增设备分析</h3>
            <div ref="deviceTypeChartRef" class="sd-chart-container sd-chart-container--lg"></div>
            <Transition name="data-card-fade">
              <div v-if="deviceTypeChart" class="year-data-card"
                   :style="{ left: deviceCardPos.x + 'px', top: deviceCardPos.y + 'px' }">
                <div class="ydc-year">{{ deviceYearCard.year }}</div>
                <div class="ydc-row"><span class="ydc-label">墒情:</span><span class="ydc-val ydc-gold">{{ deviceYearCard.墒情 }}</span></div>
                <div class="ydc-row"><span class="ydc-label">气象:</span><span class="ydc-val ydc-cyan">{{ deviceYearCard.气象 }}</span></div>
                <div class="ydc-row"><span class="ydc-label">灯诱:</span><span class="ydc-val ydc-orange">{{ deviceYearCard.灯诱 }}</span></div>
                <div class="ydc-row"><span class="ydc-label">性诱:</span><span class="ydc-val ydc-red">{{ deviceYearCard.性诱 }}</span></div>
              </div>
            </Transition>
          </section>

          <!-- 采集数据量分析 -->
          <section class="sd-chart-card">
            <div class="sd-title-row">
              <h3 class="sd-card-title">采集数据量分析</h3>
              <div class="title-deco-bars">
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
              </div>
            </div>
            <div ref="dataVolumeChartRef" class="sd-chart-container sd-chart-container--lg"></div>
            <Transition name="data-card-fade">
              <div v-if="dataVolumeChart" class="year-data-card"
                   :style="{ left: dataCardPos.x + 'px', top: dataCardPos.y + 'px' }">
                <div class="ydc-year">{{ dataYearCard.year }}</div>
                <div class="ydc-row"><span class="ydc-label">气象:</span><span class="ydc-val ydc-gold">{{ dataYearCard.气象数据 }}</span></div>
                <div class="ydc-row"><span class="ydc-label">图像:</span><span class="ydc-val ydc-cyan">{{ dataYearCard.图像数据 }}</span></div>
                <div class="ydc-row"><span class="ydc-label">虫量:</span><span class="ydc-val ydc-blue">{{ dataYearCard.虫量数据 }}</span></div>
              </div>
            </Transition>
          </section>
        </aside>

        <!-- ==================== 中央区域 ==================== -->
        <main class="sd-center-panel animate-fade-in delay-200">
          <div class="map-section">
            <div class="map-header">
              <h2 class="map-main-title">山东省年度新增站点分布图</h2>
              <span class="map-subtitle">单位：个</span>
            </div>

            <CenterMap
              ref="stationMapRef"
              :key="mapRefreshKey"
              :cities-data="stationCitiesData"
              map-mode="station"
              height="520px"
              theme-color="#2F6F9F"
              :show-toolbar="false"
              :show-actions="false"
              :show-legend="false"
              :show-zoom-controls="true"
              :show-pest-scatter="false"
              map-title=""
              @city-click="handleCityClick"
              @station-click="handleStationClick"
              @map-level-change="handleMapLevelChange"
            />

            <!-- 右下角年份选择器 -->
            <div class="year-selector-bottom">
              <span
                v-for="year in yearOptions"
                :key="year.value"
                class="year-chip"
                :class="{ 'year-chip--active': selectedYear === year.value }"
                @click="selectedYear = year.value; updateMapData()"
              >{{ year.label }}</span>
            </div>

            <!-- 底部圆形统计卡片 -->
            <div class="circular-stats-row">
              <div class="circle-stat">
                <div class="circle-inner">
                  <div class="circle-value">{{ formatNumber(totalStations) }}</div>
                  <div class="circle-label">总站点数</div>
                </div>
              </div>
              <div class="circle-stat circle-stat--new">
                <div class="circle-inner">
                  <div class="circle-value">{{ formatNumber(newStationsThisYear) }}</div>
                  <div class="circle-label">新增站点</div>
                </div>
              </div>
              <div class="circle-stat circle-stat--devices">
                <div class="circle-inner">
                  <div class="circle-value">{{ formatNumber(totalDevices) }}</div>
                  <div class="circle-label">总设备数</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- ==================== 右侧面板 ==================== -->
        <aside class="sd-right-panel animate-fade-in delay-300">
          <!-- 站点新增趋势 -->
          <section class="sd-trend-card" @click="openTrendDialog">
            <h3 class="sd-card-title">站点新增趋势（对比上一年）</h3>
            <div class="trend-gauges">
              <div v-for="gauge in trendGauges" :key="gauge.city" class="trend-gauge-item">
                <div class="gauge-circle" :class="`gauge--${gauge.trend}`">
                  <svg viewBox="0 0 100 100" class="gauge-svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1a3a5c" stroke-width="8"/>
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      :stroke="gauge.color"
                      stroke-width="8"
                      stroke-dasharray="283"
                      :stroke-dashoffset="283 - (283 * Math.min(gauge.percentage, 100) / 100)"
                      transform="rotate(-90 50 50)"
                      class="gauge-progress"
                    />
                  </svg>
                  <div class="gauge-content">
                    <div class="gauge-percent">{{ gauge.change }}%</div>
                    <div class="gauge-trend-text" :class="`gauge-trend--${gauge.trend}`">{{ gauge.trend === 'up' ? '整体上升' : '整体下降' }}</div>
                  </div>
                  <div class="gauge-scale-row">
                    <span class="gauge-scale-min">-100</span>
                    <span class="gauge-scale-max">100</span>
                  </div>
                </div>
                <div class="gauge-city-name">{{ gauge.city }}</div>
              </div>
            </div>
          </section>

          <!-- 资金使用分析（环形图） -->
          <section class="sd-pie-card">
            <div class="sd-title-row">
              <h3 class="sd-card-title">资金使用分析</h3>
              <div class="title-deco-bars">
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
                <span class="deco-bar"></span><span class="deco-bar"></span><span class="deco-bar"></span>
              </div>
            </div>
            <div ref="fundPieRef" class="sd-fund-container"></div>
            <!-- 图例（3列网格） -->
            <div class="fund-legend-grid">
              <span
                v-for="(item, idx) in fundLegendItems"
                :key="item.name"
                class="fund-legend-item"
                :class="{ 'fund-legend-item--active': idx === selectedFundIndex }"
                @click="selectFundItem(item)"
              >
                <i class="fund-dot" :style="{ background: item.color }"></i>{{ item.name }}
              </span>
            </div>
          </section>

          <!-- 设备品牌分析 -->
          <section class="sd-table-card">
            <h3 class="sd-card-title">设备品牌分析</h3>
            <table class="brand-table">
              <thead>
                <tr>
                  <th>品牌名</th>
                  <th>展示台</th>
                  <th>占比</th>
                  <th>不良率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="brand in brandData" :key="brand.name">
                  <td><i class="brand-icon">🏭</i>{{ brand.name }}</td>
                  <td>{{ brand.count }}</td>
                  <td>{{ brand.percentage }}</td>
                  <td :class="{ 'text-danger': parseFloat(brand.defectRate) > 30 }">{{ brand.defectRate }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </aside>

      </div>
    </div>

    <!-- 菜单抽屉弹框 -->
    <MenuDrawer
      v-model="isMenuDrawerOpen"
      @menu-select="handleMenuSelect"
    />

    <!-- 站点分布弹窗 -->
    <Teleport to="body">
      <div v-if="showStationDialog" class="station-dialog-overlay" @click.self="closeStationDialog">
        <div class="station-dialog">
          <div class="station-dialog-header">
            <h3 class="station-dialog-title">{{ dialogTitle }} - 站点分布详情</h3>
            <button class="station-dialog-close" @click="closeStationDialog">✕</button>
          </div>
          <div class="station-dialog-body">
            <table class="station-table" v-if="stationList.length > 0">
              <thead>
                <tr>
                  <th style="width:50px">序号</th>
                  <th style="width:100px">所属区县</th>
                  <th>站点名称</th>
                  <th style="width:110px">建设时间</th>
                  <th>建设位置</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in stationList" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ item.district }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.buildTime }}</td>
                  <td>{{ item.location }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="station-empty">暂无该地区站点数据</div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 站点新增趋势弹窗 -->
    <Teleport to="body">
      <div v-if="showTrendDialog" class="station-dialog-overlay" @click.self="closeTrendDialog">
        <div class="station-dialog">
          <div class="station-dialog-header">
            <h3 class="station-dialog-title">站点新增趋势</h3>
            <button class="station-dialog-close" @click="closeTrendDialog">✕</button>
          </div>
          <div class="station-dialog-body">
            <table class="trend-table">
              <thead>
                <tr>
                  <th style="width:50px">序号</th>
                  <th>市级名称</th>
                  <th style="width:100px">增加数量</th>
                  <th style="width:80px">增幅%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in trendList" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ item.city }}</td>
                  <td class="trend-count">{{ item.count }}</td>
                  <td :class="{ 'trend-up': item.rate > 30 }">{{ item.rate }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from '@/utils/echarts'
import CenterMap from '@/components/business/CenterMap.vue'
import MenuDrawer from '@/components/business/MenuDrawer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

// 菜单抽屉
const isMenuDrawerOpen = ref(false)

function toggleMenuDrawer() {
  isMenuDrawerOpen.value = !isMenuDrawerOpen.value
}

function handleMenuSelect(_item: string) {}

// 页面状态管理
const isPageLoading = ref(true)
const pageError = ref(false)
const pageErrorMessage = ref('')

// 年份选择器
const selectedYear = ref('2024')
const yearOptions = [
  { value: '2024', label: '2024年' },
  { value: '2023', label: '2023年' },
  { value: '2022', label: '2022年' },
  { value: 'older', label: '3年前' }
]

// 各年份各城市站点数据（模拟逐年增长）
const cityStationsByYear: Record<string, { name: string; stations: number; percentage: number }[]> = {
  '2024': [
    { name: '青岛市', stations: 1200, percentage: 90 },
    { name: '潍坊市', stations: 800, percentage: 65 },
    { name: '济南市', stations: 450, percentage: 49 },
    { name: '淄博市', stations: 362, percentage: 40 },
    { name: '东营市', stations: 250, percentage: 38 },
    { name: '烟台市', stations: 380, percentage: 42 },
    { name: '临沂市', stations: 520, percentage: 55 },
    { name: '济宁市', stations: 280, percentage: 32 },
    { name: '泰安市', stations: 260, percentage: 30 },
    { name: '威海市', stations: 200, percentage: 25 },
    { name: '德州市', stations: 250, percentage: 31 },
    { name: '聊城市', stations: 220, percentage: 28 },
    { name: '滨州市', stations: 210, percentage: 27 },
    { name: '菏泽市', stations: 230, percentage: 29 },
    { name: '枣庄市', stations: 190, percentage: 24 },
    { name: '日照市', stations: 180, percentage: 22 }
  ],
  '2023': [
    { name: '青岛市', stations: 980, percentage: 88 },
    { name: '潍坊市', stations: 660, percentage: 62 },
    { name: '济南市', stations: 380, percentage: 46 },
    { name: '淄博市', stations: 300, percentage: 38 },
    { name: '东营市', stations: 210, percentage: 35 },
    { name: '烟台市', stations: 320, percentage: 40 },
    { name: '临沂市', stations: 430, percentage: 52 },
    { name: '济宁市', stations: 240, percentage: 29 },
    { name: '泰安市', stations: 220, percentage: 27 },
    { name: '威海市', stations: 170, percentage: 23 },
    { name: '德州市', stations: 210, percentage: 28 },
    { name: '聊城市', stations: 185, percentage: 25 },
    { name: '滨州市', stations: 175, percentage: 24 },
    { name: '菏泽市', stations: 195, percentage: 26 },
    { name: '枣庄市', stations: 160, percentage: 21 },
    { name: '日照市', stations: 150, percentage: 19 }
  ],
  '2022': [
    { name: '青岛市', stations: 780, percentage: 85 },
    { name: '潍坊市', stations: 520, percentage: 58 },
    { name: '济南市', stations: 310, percentage: 42 },
    { name: '淄博市', stations: 240, percentage: 35 },
    { name: '东营市', stations: 170, percentage: 32 },
    { name: '烟台市', stations: 260, percentage: 37 },
    { name: '临沂市', stations: 340, percentage: 48 },
    { name: '济宁市', stations: 195, percentage: 26 },
    { name: '泰安市', stations: 180, percentage: 24 },
    { name: '威海市', stations: 140, percentage: 20 },
    { name: '德州市', stations: 170, percentage: 25 },
    { name: '聊城市', stations: 150, percentage: 22 },
    { name: '滨州市', stations: 140, percentage: 21 },
    { name: '菏泽市', stations: 160, percentage: 23 },
    { name: '枣庄市', stations: 130, percentage: 18 },
    { name: '日照市', stations: 120, percentage: 16 }
  ],
  'older': [
    { name: '青岛市', stations: 580, percentage: 80 },
    { name: '潍坊市', stations: 380, percentage: 52 },
    { name: '济南市', stations: 240, percentage: 36 },
    { name: '淄博市', stations: 180, percentage: 30 },
    { name: '东营市', stations: 130, percentage: 27 },
    { name: '烟台市', stations: 200, percentage: 33 },
    { name: '临沂市', stations: 250, percentage: 43 },
    { name: '济宁市', stations: 150, percentage: 22 },
    { name: '泰安市', stations: 140, percentage: 20 },
    { name: '威海市', stations: 110, percentage: 17 },
    { name: '德州市', stations: 130, percentage: 21 },
    { name: '聊城市', stations: 115, percentage: 18 },
    { name: '滨州市', stations: 105, percentage: 17 },
    { name: '菏泽市', stations: 125, percentage: 19 },
    { name: '枣庄市', stations: 100, percentage: 15 },
    { name: '日照市', stations: 90, percentage: 13 }
  ]
}

// 城市站点排行数据（根据选中年份动态切换）
const cityRankings = computed(() => cityStationsByYear[selectedYear.value] || cityStationsByYear['2024'])

// 排行榜展开状态
const rankingExpanded = ref(false)
const displayedRankings = computed(() => rankingExpanded.value ? cityRankings.value : cityRankings.value.slice(0, 5))
function toggleRanking() {
  rankingExpanded.value = !rankingExpanded.value
}

// 地图数据
const stationMapRef = ref<InstanceType<typeof CenterMap> | null>(null)

const stationCitiesData = computed(() => {
  return cityRankings.value.map(city => ({
    name: city.name,
    value: city.stations,
    coord: getCityCoord(city.name)
  }))
})

function getCityCoord(cityName: string): [number, number] {
  const coords: Record<string, [number, number]> = {
    '济南市': [117.0, 36.65],
    '青岛市': [120.33, 36.07],
    '淄博市': [118.05, 36.78],
    '枣庄市': [117.27, 34.76],
    '东营市': [118.49, 37.46],
    '烟台市': [121.39, 37.52],
    '潍坊市': [119.1, 36.7],
    '济宁市': [116.59, 35.41],
    '泰安市': [117.13, 36.18],
    '威海市': [122.1, 37.5],
    '日照市': [119.46, 35.42],
    '临沂市': [118.35, 35.05],
    '德州市': [116.29, 37.45],
    '聊城市': [115.97, 36.44],
    '滨州市': [117.97, 37.36],
    '菏泽市': [115.43, 35.24]
  }
  return coords[cityName] || [118.0, 36.6]
}

// 统计数据（根据年份动态计算）
const totalStations = computed(() => cityRankings.value.reduce((sum, c) => sum + c.stations, 0))

// 各年新增站点数（对比上一年）
const newStationsByYear: Record<string, number> = {
  '2024': 1382,  // 2024总数 - 2023总数 = 6322 - 4940
  '2023': 1148,  // 2023总数 - 2022总数 = 4940 - 3792
  '2022': 996,   // 2022总数 - older总数 = 3792 - 2796
  'older': 2796  // 3年前基数
}
const newStationsThisYear = computed(() => newStationsByYear[selectedYear.value] || 365)
const totalDevices = ref(4335)

// 地图刷新key（切换年份时递增，强制CenterMap重新渲染）
const mapRefreshKey = ref(0)

function formatNumber(num: number): string {
  return num.toLocaleString()
}

// 趋势仪表盘数据（对比上一年：3个城市）
const trendGauges = ref([
  { city: '济南市', current: 450, lastYear: 455, change: -1, percentage: 1, color: '#ff4757', trend: 'down' },
  { city: '青岛市', current: 1200, lastYear: 1278, change: -6, percentage: 6, color: '#ff4757', trend: 'down' },
  { city: '烟台市', current: 380, lastYear: 242, change: 57, percentage: 57, color: '#2F6F9F', trend: 'up' }
])

// 资金使用分析数据（环形图）
interface FundItem {
  name: string
  value: number
  color: string
}
const fundRawData = ref<FundItem[]>([
  { name: '国家资金', value: 3200, color: '#3b82f6' },
  { name: '省资金全', value: 2800, color: '#2F6F9F' },
  { name: '省财政专项', value: 1596, color: '#60a5fa' },
  { name: '中央财政专项', value: 1200, color: '#f59e0b' },
  { name: '本级财政资金', value: 980, color: '#fbbf24' },
  { name: '乡村振兴资金', value: 750, color: '#10b981' },
  { name: '乡镇振兴资金', value: 520, color: '#a855f7' },
  { name: '中央救灾资金', value: 380, color: '#ec4899' },
  { name: '其他', value: 200, color: '#e2e8f0' }
])

const selectedFundIndex = ref(2) // 默认选中"省财政专项"
const fundCenterData = computed(() => {
  const item = fundRawData.value[selectedFundIndex.value]
  const total = fundRawData.value.reduce((s, i) => s + i.value, 0)
  return {
    name: item.name,
    percent: Math.round(item.value / total * 100),
    total: total.toLocaleString()
  }
})
const fundLegendItems = computed(() => fundRawData.value)

function selectFundItem(item: FundItem) {
  const idx = fundRawData.value.findIndex(i => i.name === item.name)
  if (idx >= 0) {
    selectedFundIndex.value = idx
    updateFundPieHighlight()
  }
}

// 品牌数据
const brandData = ref([
  { name: '托普云农', count: 90, percentage: '44.2%', defectRate: '4.2%' },
  { name: '济南农智', count: 62, percentage: '30.5%', defectRate: '21.5%' },
  { name: '济南祥辰', count: 35, percentage: '17.2%', defectRate: '30.0%' },
  { name: '宁波恒康', count: 16, percentage: '8.1%', defectRate: '48.2%' }
])

// 图表实例
const deviceTypeChartRef = ref<HTMLDivElement | null>(null)
const dataVolumeChartRef = ref<HTMLDivElement | null>(null)
const fundPieRef = ref<HTMLDivElement | null>(null)
let deviceTypeChart: echarts.ECharts | null = null
let dataVolumeChart: echarts.ECharts | null = null
let fundPieChart: echarts.ECharts | null = null

// ===== 年份轮播 Timer =====
const deviceYearIndex = ref(0)  // 0~4 (2021~2025)
const dataYearIndex = ref(0)    // 0~5 (2021~2026)
const DEVICE_YEARS = ['2021', '2022', '2023', '2024', '2025']
const DATA_YEARS = ['2021', '2022', '2023', '2024', '2025', '2026']
let deviceTimer: ReturnType<typeof setInterval> | null = null
let dataTimer: ReturnType<typeof setInterval> | null = null

// 设备类型原始数据
const deviceTypeRawData = {
  墒情: [25, 22, 12, 10, 15],
  气象: [28, 32, 27, 24, 19],
  灯诱: [3, 5, 45, 48, 23],
  性诱: [36, 10, 7, 38, 22]
}

// 数据量原始数据（按原型图曲线形状）
const dataVolumeRawData = {
  气象数据: [30, 34, 33, 35, 48, 38],
  图像数据: [45, 47, 38, 25, 37, 18],
  虫量数据: [28, 46, 35, 15, 10, 27]
}

// 当前年份数据卡片
const deviceYearCard = computed(() => {
  const i = deviceYearIndex.value
  return {
    year: DEVICE_YEARS[i],
    墒情: deviceTypeRawData.墒情[i],
    气象: deviceTypeRawData.气象[i],
    灯诱: deviceTypeRawData.灯诱[i],
    性诱: deviceTypeRawData.性诱[i]
  }
})

const dataYearCard = computed(() => {
  const i = dataYearIndex.value
  return {
    year: DATA_YEARS[i],
    气象数据: dataVolumeRawData.气象数据[i],
    图像数据: dataVolumeRawData.图像数据[i],
    虫量数据: dataVolumeRawData.虫量数据[i]
  }
})

// 数据卡片位置（跟随折线图数据点）
const deviceCardPos = ref({ x: 0, y: 0 })
const dataCardPos = ref({ x: 0, y: 0 })

// 初始化设备类型分析图表（平面监测设备：灯诱/气吸/扑打/电诱）
function getDeviceTypeOption() {
  const mi = deviceYearIndex.value
  return {
    backgroundColor: 'transparent',
    grid: { top: 38, right: 50, bottom: 36, left: 44, containLabel: true },
    legend: { data: ['墒情', '气象', '灯诱', '性诱'], top: 0, textStyle: { color: '#94a3b8', fontSize: 11 }, itemWidth: 16, itemHeight: 3, icon: 'line' },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(12,28,46,.95)', borderColor: 'rgba(251,191,36,.3)', borderWidth: 1, textStyle: { color: '#e2e8f0', fontSize: 11 } },
    xAxis: {
      type: 'category', data: DEVICE_YEARS,
      axisLine: { show: true, lineStyle: { color: 'rgba(212,165,116,.3)' } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        interval: 0,
        color: '#8899aa',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value', min: 0, max: 50,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(26,58,92,0.4)', type: 'dashed' } },
      axisLabel: { color: '#8899aa', fontSize: 11 },
      name: '台/套', nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 35, 0, 0] }
    },
    series: [
      {
        name: '墒情', type: 'line', smooth: true,
        data: deviceTypeRawData.墒情.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#fbbf24', borderColor: '#fff', borderWidth: 2 } : { color: '#fbbf24' }
        })),
        lineStyle: { width: 2.5, color: '#fbbf24' },
        symbolSize: (idx: number) => (idx === mi ? 9 : 5),
        markLine: { silent: true, data: [{ xAxis: mi }], lineStyle: { color: 'rgba(251,191,36,.5)', width: 1.5, type: 'dashed' }, symbol: 'none' },
        markPoint: { silent: true, data: [{ coord: [mi, deviceTypeRawData.墒情[mi]], symbol: 'circle', symbolSize: 22, itemStyle: { color: 'rgba(251,191,36,.2)' } }] }
      },
      {
        name: '气象', type: 'line', smooth: true,
        data: deviceTypeRawData.气象.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#2F6F9F', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#2F6F9F' }
        })),
        lineStyle: { width: 2.5, color: '#2F6F9F' },
        symbolSize: (idx: number) => (idx === mi ? 7 : 5)
      },
      {
        name: '灯诱', type: 'line', smooth: true,
        data: deviceTypeRawData.灯诱.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#f59e0b', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#f59e0b' }
        })),
        lineStyle: { width: 2.5, color: '#f59e0b' },
        symbolSize: (idx: number) => (idx === mi ? 7 : 5)
      },
      {
        name: '性诱', type: 'line', smooth: true,
        data: deviceTypeRawData.性诱.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#ef4444', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#ef4444' }
        })),
        lineStyle: { width: 2.5, color: '#ef4444' },
        symbolSize: (idx: number) => (idx === mi ? 7 : 5)
      }
    ]
  }
}

function initDeviceTypeChart() {
  if (!deviceTypeChartRef.value) return
  deviceTypeChart = echarts.init(deviceTypeChartRef.value)
  deviceTypeChart.setOption(getDeviceTypeOption())
  nextTick(() => setTimeout(updateDeviceCardPosition, 150))
}

function getDataVolumeOption() {
  const mi = dataYearIndex.value
  return {
    backgroundColor: 'transparent',
    grid: { top: 38, right: 50, bottom: 44, left: 44, containLabel: true },
    legend: {
      data: ['气象数据', '图像数据', '虫量数据'],
      top: 0,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 20, itemHeight: 2,
      icon: 'line' // 线条图标（匹配原型）
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(12,28,46,.95)',
      borderColor: 'rgba(251,191,36,.3)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 11 }
    },
    xAxis: {
      type: 'category', data: DATA_YEARS,
      axisLine: { show: true, lineStyle: { color: 'rgba(212,165,116,.3)' } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        interval: 0,
        color: '#8899aa',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value', min: 0, max: 50,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(26,58,92,0.4)', type: 'dashed' } },
      axisLabel: { color: '#8899aa', fontSize: 11 },
      name: '条', nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 20, 0, 0] }
    },
    series: [
      {
        name: '气象数据', type: 'line', smooth: true, smoothMonotone: 'x',
        data: dataVolumeRawData.气象数据.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#fbbf24', borderColor: '#fff', borderWidth: 2 } : { color: '#fbbf24' }
        })),
        lineStyle: { width: 2.5, color: '#fbbf24' },
        symbolSize: (idx: number) => (idx === mi ? 9 : 5),
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(251,191,36,.15)' }, { offset: 1, color: 'rgba(251,191,36,0)' }
        ]) },
        markLine: { silent: true, data: [{ xAxis: mi }], lineStyle: { color: 'rgba(251,191,36,.5)', width: 1.5, type: 'dashed' }, symbol: 'none' },
        markPoint: { silent: true, data: [{ coord: [mi, dataVolumeRawData.气象数据[mi]], symbol: 'circle', symbolSize: 22, itemStyle: { color: 'rgba(251,191,36,.2)' } }] }
      },
      {
        name: '图像数据', type: 'line', smooth: true, smoothMonotone: 'x',
        data: dataVolumeRawData.图像数据.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#2F6F9F', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#2F6F9F' }
        })),
        lineStyle: { width: 2.5, color: '#2F6F9F' },
        symbolSize: (idx: number) => (idx === mi ? 7 : 5),
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(47, 111, 159,.12)' }, { offset: 1, color: 'rgba(47, 111, 159,0)' }
        ]) }
      },
      {
        name: '虫量数据', type: 'line', smooth: true, smoothMonotone: 'x',
        data: dataVolumeRawData.虫量数据.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#4a90d9', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#4a90d9' }
        })),
        lineStyle: { width: 2.5, color: '#4a90d9' },
        symbolSize: (idx: number) => (idx === mi ? 7 : 5),
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(74,144,217,.12)' }, { offset: 1, color: 'rgba(74,144,217,0)' }
        ]) }
      }
    ]
  }
}

function initDataVolumeChart() {
  if (!dataVolumeChartRef.value) return
  dataVolumeChart = echarts.init(dataVolumeChartRef.value)
  dataVolumeChart.setOption(getDataVolumeOption())
  nextTick(() => setTimeout(updateDataCardPosition, 150))
}

// 初始化资金使用分析环形图
function initFundPieChart() {
  if (!fundPieRef.value) return
  fundPieChart = echarts.init(fundPieRef.value)
  // 点击扇区切换选中项
  fundPieChart.on('click', (params: any) => {
    const idx = fundRawData.value.findIndex(i => i.name === params.name)
    if (idx >= 0) {
      selectedFundIndex.value = idx
      updateFundPieOption()
    }
  })
  updateFundPieOption()
}

function getFundPieOption() {
  const si = selectedFundIndex.value
  const center = fundCenterData.value
  return {
    backgroundColor: 'transparent',
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: center.name,
          fontSize: 12,
          fontWeight: 600,
          fill: '#e2e8f0',
          textAlign: 'center'
        },
        z: 10
      },
      {
        type: 'text',
        left: 'center',
        top: '54%',
        style: {
          text: `${center.percent}%/${center.total}`,
          fontSize: 18,
          fontWeight: 800,
          fill: '#60a5fa',
          fontFamily: 'Courier New, monospace',
          textAlign: 'center'
        },
        z: 10
      }
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(12,28,46,.95)',
      borderColor: 'rgba(47, 111, 159,.3)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 11 },
      formatter: (p: any) => `${p.name}: ${p.value.toLocaleString()} (${p.percent}%)`
    },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: 'rgba(6,10,18,.85)', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 8,
        itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,.5)' }
      },
      labelLine: { show: false },
      data: fundRawData.value.map((item, idx) => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: item.color,
          opacity: idx === si ? 1 : 0.65,
          borderColor: idx === si ? '#fff' : 'rgba(255,255,255,.2)',
          borderWidth: idx === si ? 3 : 1
        }
      }))
    }]
  }
}

function updateFundPieOption() {
  if (!fundPieChart) return
  fundPieChart.setOption(getFundPieOption(), true)
}

function updateFundPieHighlight() {
  if (!fundPieChart) return
  fundPieChart.setOption(getFundPieOption(), true)
}

// 更新地图数据（根据选择的年份）
function updateMapData() {
  mapRefreshKey.value++
}

// ===== 年份轮播逻辑 =====
function advanceDeviceYear() {
  deviceYearIndex.value = (deviceYearIndex.value + 1) % DEVICE_YEARS.length
  if (deviceTypeChart) deviceTypeChart.setOption(getDeviceTypeOption(), true)
  nextTick(() => setTimeout(updateDeviceCardPosition, 50))
}

function advanceDataYear() {
  dataYearIndex.value = (dataYearIndex.value + 1) % DATA_YEARS.length
  if (dataVolumeChart) dataVolumeChart.setOption(getDataVolumeOption(), true)
  nextTick(() => setTimeout(updateDataCardPosition, 50))
}

function updateDeviceCardPosition() {
  if (!deviceTypeChart) return
  const mi = deviceYearIndex.value
  const pixel = deviceTypeChart.convertToPixel('grid', [mi, deviceTypeRawData.墒情[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    deviceCardPos.value = { x: pixel[0] + 18, y: pixel[1] - 28 }
  }
}

function updateDataCardPosition() {
  if (!dataVolumeChart) return
  const mi = dataYearIndex.value
  const pixel = dataVolumeChart.convertToPixel('grid', [mi, dataVolumeRawData.气象数据[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    dataCardPos.value = { x: pixel[0] + 18, y: pixel[1] - 28 }
  }
}

// 地图点击事件处理
function handleCityClick(data: any) {
  openStationDialog(data.name)
}

// 地图散点点击事件处理
function handleStationClick(data: any) {
  openStationDialog(data.name)
}

// ===== 站点分布弹窗 =====
interface StationItem {
  district: string
  name: string
  buildTime: string
  location: string
}
const showStationDialog = ref(false)
const dialogTitle = ref('')
const stationList = ref<StationItem[]>([])

const stationDataMap: Record<string, StationItem[]> = {
  '青岛市': [
    { district: '市南区', name: '市南区金门路街道虫情监测站', buildTime: '2024-03-15', location: '市南区金门路街道宁夏路128号' },
    { district: '市北区', name: '市北区登州路街道灯诱监测站', buildTime: '2024-05-22', location: '市北区登州路街道延安路56号' },
    { district: '崂山区', name: '崂山区沙子口智能诱捕站', buildTime: '2024-02-18', location: '崂山区沙子口街道崂山路99号' },
    { district: '黄岛区', name: '黄岛区薛家岛虫情观测点', buildTime: '2024-07-08', location: '黄岛区薛家岛街道长江路11号' },
    { district: '城阳区', name: '城阳区棘洪滩测报站', buildTime: '2024-04-10', location: '城阳区棘洪滩街道正阳路78号' },
    { district: '即墨区', name: '即墨区蓝村智能防控站', buildTime: '2024-06-30', location: '即墨区蓝村镇青威路200号' },
    { district: '胶州市', name: '胶州市阜安街道虫情监测站', buildTime: '2024-09-12', location: '胶州市阜安街道胶州路33号' },
    { district: '平度市', name: '平度市同和街道灯诱观测站', buildTime: '2024-08-05', location: '平度市同和街道青岛路126号' },
    { district: '莱西市', name: '莱西市水集街道性诱测报站', buildTime: '2024-10-20', location: '莱西市水集街道烟台路85号' },
    { district: '李沧区', name: '李沧区振华路街道虫情监测站', buildTime: '2024-11-08', location: '李沧区振华路街道京口路42号' },
    { district: '崂山区', name: '崂山区沙子口测报站', buildTime: '2024-03-28', location: '崂山区沙子口街道崂山路200号' },
    { district: '胶州市', name: '胶州市李哥庄镇观测站', buildTime: '2024-12-05', location: '胶州市李哥庄镇广场路18号' },
  ],
  '潍坊市': [
    { district: '奎文区', name: '奎文区潍州路虫情监测站', buildTime: '2024-04-16', location: '奎文区潍州路街道胜利街120号' },
    { district: '潍城区', name: '潍城区南关街道灯诱观测站', buildTime: '2024-06-20', location: '潍城区南关街道健康街88号' },
    { district: '寒亭区', name: '寒亭区开元街道智能诱捕站', buildTime: '2024-08-15', location: '寒亭区开元街道通亭街56号' },
    { district: '青州市', name: '青州市云门山街道虫情观测站', buildTime: '2024-03-05', location: '青州市云门山街道范公亭路30号' },
    { district: '寿光市', name: '寿光市洛城街道测报站', buildTime: '2024-05-18', location: '寿光市洛城街道圣城街99号' },
    { district: '寿光市', name: '寿光市洛城街道观测站', buildTime: '2024-07-22', location: '寿光市洛城街道农圣街66号' },
    { district: '诸城市', name: '诸城市龙都街道虫情防控站', buildTime: '2024-09-30', location: '诸城市龙都街道人民路15号' },
    { district: '高密市', name: '高密市朝阳街道灯诱监测站', buildTime: '2024-10-12', location: '高密市朝阳街道凤凰大街78号' },
    { district: '安丘市', name: '安丘市兴安街道性诱测报站', buildTime: '2024-11-25', location: '安丘市兴安街道青云路44号' },
    { district: '昌邑市', name: '昌邑市奎聚街道虫情观测点', buildTime: '2024-12-10', location: '昌邑市奎聚街道北海路22号' },
  ],
  '济南市': [
    { district: '市中区', name: '市中区十六里河虫情监测站', buildTime: '2024-03-20', location: '市中区十六里河街道望岳路66号' },
    { district: '历下区', name: '历下区龙洞街道监测站', buildTime: '2024-05-10', location: '历下区龙洞街道龙奥北路88号' },
    { district: '天桥区', name: '天桥区泺口街道灯诱观测站', buildTime: '2024-07-14', location: '天桥区泺口街道济泺路120号' },
    { district: '槐荫区', name: '槐荫区张庄路智能诱捕站', buildTime: '2024-04-28', location: '槐荫区张庄路经十路450号' },
    { district: '历城区', name: '历城区华山街道虫情观测点', buildTime: '2024-08-08', location: '历城区华山街道华山路33号' },
    { district: '章丘区', name: '章丘区双山街道测报站', buildTime: '2024-06-18', location: '章丘区双山街道绣水大街55号' },
    { district: '长清区', name: '长清区文昌街道防控站', buildTime: '2024-09-25', location: '长清区文昌街道清河街78号' },
    { district: '济阳区', name: '济阳区济北街道虫情监测站', buildTime: '2024-10-28', location: '济阳区济北街道开元大街99号' },
  ],
  '烟台市': [
    { district: '芝罘区', name: '芝罘区只楚路虫情监测站', buildTime: '2024-02-28', location: '芝罘区只楚路街道南大街88号' },
    { district: '莱山区', name: '莱山区黄海路街道灯诱观测站', buildTime: '2024-05-06', location: '莱山区黄海路街道观海路66号' },
    { district: '蓬莱区', name: '蓬莱区紫荆山观测站', buildTime: '2024-07-30', location: '蓬莱区紫荆山街道钟楼路22号' },
    { district: '龙口市', name: '龙口市东莱街道虫情测报站', buildTime: '2024-04-15', location: '龙口市东莱街道港城大道44号' },
    { district: '莱阳市', name: '莱阳市城厢街道防控站', buildTime: '2024-09-10', location: '莱阳市城厢街道旌旗路33号' },
    { district: '招远市', name: '招远市温泉街道智能诱捕站', buildTime: '2024-11-15', location: '招远市温泉街道温泉路100号' },
  ],
  '临沂市': [
    { district: '兰山区', name: '兰山区金雀山街道虫情监测站', buildTime: '2024-03-12', location: '兰山区金雀山街道沂蒙路158号' },
    { district: '罗庄区', name: '罗庄区盛庄街道灯诱观测站', buildTime: '2024-06-05', location: '罗庄区盛庄街道湖北路46号' },
    { district: '河东区', name: '河东区九曲街道测报站', buildTime: '2024-08-22', location: '河东区九曲街道东兴路89号' },
    { district: '沂水县', name: '沂水县沂城街道虫情防控站', buildTime: '2024-05-30', location: '沂水县沂城街道长安路33号' },
    { district: '兰陵县', name: '兰陵县卞庄街道智能诱捕站', buildTime: '2024-07-18', location: '兰陵县卞庄街道兰陵路55号' },
    { district: '费县', name: '费县费城街道观测站', buildTime: '2024-10-06', location: '费县费城街道建设路78号' },
    { district: '平邑县', name: '平邑县平邑街道虫情监测站', buildTime: '2024-12-02', location: '平邑县平邑街道浚河路22号' },
    { district: '临沭县', name: '临沭县临沭街道灯诱测报站', buildTime: '2024-11-20', location: '临沭县临沭街道苍山路66号' },
  ],
  '淄博市': [
    { district: '张店区', name: '张店区马尚街道虫情监测站', buildTime: '2024-04-08', location: '张店区马尚街道人民路56号' },
    { district: '淄川区', name: '淄川区般阳路街道灯诱观测站', buildTime: '2024-06-22', location: '淄川区般阳路街道淄城路88号' },
    { district: '临淄区', name: '临淄区雪宫街道智能诱捕站', buildTime: '2024-08-16', location: '临淄区雪宫街道桓公路30号' },
    { district: '博山区', name: '博山区城东街道虫情测报站', buildTime: '2024-09-28', location: '博山区城东街道沿河路44号' },
    { district: '桓台县', name: '桓台县索镇观测站', buildTime: '2024-10-15', location: '桓台县索镇中心大街22号' },
  ],
  '济宁市': [
    { district: '任城区', name: '任城区阜桥街道虫情监测站', buildTime: '2024-03-25', location: '任城区阜桥街道太白路66号' },
    { district: '兖州区', name: '兖州区鼓楼街道灯诱观测站', buildTime: '2024-06-12', location: '兖州区鼓楼街道建设路55号' },
    { district: '曲阜市', name: '曲阜市鲁城街道智能诱捕站', buildTime: '2024-08-28', location: '曲阜市鲁城街道春秋路30号' },
    { district: '邹城市', name: '邹城市钢山街道虫情测报站', buildTime: '2024-07-10', location: '邹城市钢山街道太平路88号' },
    { district: '微山县', name: '微山县夏镇街道观测站', buildTime: '2024-11-08', location: '微山县夏镇街道奎文路22号' },
  ],
  '泰安市': [
    { district: '泰山区', name: '泰山区财源街道虫情监测站', buildTime: '2024-04-20', location: '泰山区财源街道东岳大街66号' },
    { district: '岱岳区', name: '岱岳区粥店街道灯诱观测站', buildTime: '2024-06-18', location: '岱岳区粥店街道泰山大街55号' },
    { district: '新泰市', name: '新泰市青云街道智能诱捕站', buildTime: '2024-09-05', location: '新泰市青云街道府前街22号' },
    { district: '肥城市', name: '肥城市新城街道虫情测报站', buildTime: '2024-10-22', location: '肥城市新城街道龙山路33号' },
  ],
  '威海市': [
    { district: '环翠区', name: '环翠区鲸园街道虫情监测站', buildTime: '2024-03-08', location: '环翠区鲸园街道海滨路88号' },
    { district: '文登区', name: '文登区天福街道灯诱观测站', buildTime: '2024-06-28', location: '文登区天福街道文山路55号' },
    { district: '荣成市', name: '荣成市崖头街道智能诱捕站', buildTime: '2024-08-14', location: '荣成市崖头街道成山大道30号' },
    { district: '乳山市', name: '乳山市城区街道虫情测报站', buildTime: '2024-10-18', location: '乳山市城区街道胜利街22号' },
  ],
  '日照市': [
    { district: '东港区', name: '东港区日照街道虫情监测站', buildTime: '2024-04-12', location: '东港区日照街道海曲路66号' },
    { district: '岚山区', name: '岚山区岚山头街道灯诱观测站', buildTime: '2024-07-05', location: '岚山区岚山头街道岚山路33号' },
    { district: '五莲县', name: '五莲县洪凝街道智能诱捕站', buildTime: '2024-09-20', location: '五莲县洪凝街道富强路22号' },
  ],
  '德州市': [
    { district: '德城区', name: '德城区新湖街道虫情监测站', buildTime: '2024-04-25', location: '德城区新湖街道东方红路55号' },
    { district: '禹城市', name: '禹城市市中街道灯诱观测站', buildTime: '2024-06-30', location: '禹城市市中街道行政街88号' },
    { district: '乐陵市', name: '乐陵市市中街道智能诱捕站', buildTime: '2024-08-18', location: '乐陵市市中街道湖滨路22号' },
  ],
  '聊城市': [
    { district: '东昌府区', name: '东昌府区柳园街道虫情监测站', buildTime: '2024-05-08', location: '东昌府区柳园街道东昌路66号' },
    { district: '临清市', name: '临清市青年路街道灯诱观测站', buildTime: '2024-07-15', location: '临清市青年路街道新华路33号' },
    { district: '莘县', name: '莘县燕塔街道智能诱捕站', buildTime: '2024-10-10', location: '莘县燕塔街道振兴街22号' },
  ],
  '菏泽市': [
    { district: '牡丹区', name: '牡丹区东城街道虫情监测站', buildTime: '2024-04-05', location: '牡丹区东城街道中华路88号' },
    { district: '曹县', name: '曹县曹城街道灯诱观测站', buildTime: '2024-06-25', location: '曹县曹城街道珠江路55号' },
    { district: '单县', name: '单县北城街道智能诱捕站', buildTime: '2024-09-15', location: '单县北城街道胜利路22号' },
  ],
  '枣庄市': [
    { district: '薛城区', name: '薛城区临城街道虫情监测站', buildTime: '2024-05-02', location: '薛城区临城街道光明路66号' },
    { district: '滕州市', name: '滕州市龙泉街道灯诱观测站', buildTime: '2024-07-20', location: '滕州市龙泉街道北辛路33号' },
  ],
  '东营市': [
    { district: '东营区', name: '东营区文汇街道虫情监测站', buildTime: '2024-03-30', location: '东营区文汇街道济南路88号' },
    { district: '河口区', name: '河口区河口街道灯诱观测站', buildTime: '2024-06-15', location: '河口区河口街道海宁路55号' },
  ],
  '滨州市': [
    { district: '滨城区', name: '滨城区市中街道虫情监测站', buildTime: '2024-04-18', location: '滨城区市中街道黄河五路66号' },
    { district: '邹平市', name: '邹平市黛溪街道灯诱观测站', buildTime: '2024-08-02', location: '邹平市黛溪街道鹤伴二路22号' },
  ],
}

function openStationDialog(regionName: string) {
  dialogTitle.value = regionName
  // 精确匹配
  if (stationDataMap[regionName]) {
    stationList.value = stationDataMap[regionName]
  } else {
    // 模糊匹配：从站点名中提取城市名（如 "临沂市兰山区监测站" → "临沂市"）
    const matchedCity = Object.keys(stationDataMap).find(city => regionName.startsWith(city))
    stationList.value = matchedCity ? stationDataMap[matchedCity] : []
  }
  showStationDialog.value = true
}

function closeStationDialog() {
  showStationDialog.value = false
}

// ===== 站点新增趋势弹窗 =====
interface TrendItem {
  city: string
  count: number
  rate: number
}
const showTrendDialog = ref(false)
const trendList = ref<TrendItem[]>([])

const trendDataList: TrendItem[] = [
  { city: '青岛市', count: 1200, rate: 44.2 },
  { city: '潍坊市', count: 800, rate: 65.3 },
  { city: '济南市', count: 450, rate: 28.6 },
  { city: '烟台市', count: 380, rate: 35.1 },
  { city: '临沂市', count: 520, rate: 42.8 },
  { city: '淄博市', count: 310, rate: 22.5 },
  { city: '济宁市', count: 280, rate: 18.9 },
  { city: '泰安市', count: 260, rate: 30.5 },
  { city: '威海市', count: 200, rate: 25.3 },
  { city: '日照市', count: 180, rate: 33.6 },
  { city: '德州市', count: 250, rate: 38.2 },
  { city: '聊城市', count: 220, rate: 27.8 },
  { city: '菏泽市', count: 230, rate: 29.4 },
  { city: '枣庄市', count: 190, rate: 31.7 },
  { city: '东营市', count: 170, rate: 21.5 },
  { city: '滨州市', count: 210, rate: 36.0 },
]

function openTrendDialog() {
  trendList.value = trendDataList
  showTrendDialog.value = true
}

function closeTrendDialog() {
  showTrendDialog.value = false
}

// 地图级别变更事件处理
function handleMapLevelChange(_level: string, _cityName?: string, _countyName?: string) {}

// 错误处理函数
function showError(message: string) {
  console.error('[StationDistribution] ❌', message)
  pageError.value = true
  pageErrorMessage.value = message
  isPageLoading.value = false
}

function retryLoad() {
  pageError.value = false
  pageErrorMessage.value = ''
  isPageLoading.value = true
  initPage()
}

async function initPage() {
  try {
    // 先关闭 loading，让 v-else 内容区域渲染到 DOM
    isPageLoading.value = false
    await nextTick()

    try { initDeviceTypeChart() } catch (_) {}
    try { initDataVolumeChart() } catch (_) {}
    try { initFundPieChart() } catch (_) {}

    // 启动年份轮播 Timer
    deviceTimer = setInterval(advanceDeviceYear, 2000)
    dataTimer = setInterval(advanceDataYear, 2000)

    window.addEventListener('resize', handleResize)
  } catch (error) {
    showError(`页面初始化失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

onMounted(async () => {
  await initPage()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (deviceTimer) { clearInterval(deviceTimer); deviceTimer = null }
  if (dataTimer) { clearInterval(dataTimer); dataTimer = null }
  deviceTypeChart?.dispose()
  dataVolumeChart?.dispose()
  fundPieChart?.dispose()
})

function handleResize() {
  deviceTypeChart?.resize()
  dataVolumeChart?.resize()
  fundPieChart?.resize()
}
</script>

<style scoped>
.station-distribution {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ===== 页面加载/错误状态 ===== */
.page-loading,
.page-error {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: var(--bg-page);
  z-index: 9999;
}

.page-loading .loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(47, 111, 159, 0.2);
  border-top-color: #2F6F9F;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.page-loading span {
  color: #2F6F9F;
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-error {
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.page-error h3 {
  color: #ff4757;
  font-size: 24px;
  margin: 0 0 10px;
}

.page-error p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0 0 24px;
  max-width: 400px;
}

.retry-btn,
.back-btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  margin: 0 8px;
}

.retry-btn {
  background: linear-gradient(135deg, #2F6F9F, #0891b2);
  color: #fff;
  box-shadow: 0 4px 16px rgba(47, 111, 159, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(47, 111, 159, 0.4);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* ===== 内容包装器 ===== */
.sd-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 主体布局（与首页一致） ===== */
.sd-main-body {
  flex: 1;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 340px;
  gap: 10px;
  padding: 8px 12px 6px;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

@media(max-width: 1600px) {
  .sd-main-body {
    grid-template-columns: 290px minmax(0, 1fr) 310px;
    gap: 8px;
    padding: 6px 10px 4px;
  }
}

@media(max-width: 1366px) {
  .sd-main-body {
    grid-template-columns: 260px minmax(0, 1fr) 280px;
    gap: 6px;
    padding: 4px 8px 2px;
  }
}

/* ===== 左侧面板 ===== */
.sd-left-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  align-self: stretch;
}

/* 排行榜卡片：更紧凑 */
.sd-ranking-card {
  flex: 0 0 auto;
  max-height: 170px;
  overflow-y: auto;
}

/* 图表卡片弹性填充剩余空间 */
.sd-chart-card {
  flex: 1;
  min-height: 0;
}

/* 设备类型图 */
.sd-chart-card:first-of-type {
  flex: 1;
}

/* 数据量分析：与设备类型等比 */
.sd-chart-card:last-of-type {
  flex: 1;
}

/* 走量数据采集卡片 */
.sd-data-collect-card {
  flex-shrink: 0;
}
.collect-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 8px 6px;
}
.collect-gauge {
  flex-shrink: 0;
}
.collect-gauge .gauge-svg {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 12px rgba(47, 111, 159,.2));
}
.collect-stats {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}
.collect-stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.stat-dot--blue { background: #3b82f6; }
.stat-dot--orange { background: #f59e0b; }
.stat-dot--green { background: #10b981; }
.stat-dot--cyan { background: #2F6F9F; }
.collect-stat-row .stat-label {
  font-size: 11.5px;
  color: #7dd3fc;
  font-weight: 500;
  white-space: nowrap;
  min-width: 52px;
}
.collect-stat-row .stat-value {
  font-size: 13px;
  font-weight: 800;
  color: #e2e8f0;
  min-width: 48px;
  text-align: right;
  font-family: 'Courier New', monospace;
}
.collect-stat-row .stat-pct {
  font-size: 12px;
  font-weight: 700;
  margin-left: auto;
}

/* 卡片通用样式 */
.sd-card, .sd-chart-card, .sd-table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  box-shadow: var(--shadow-md);
  position: relative;
}

/* 图表卡片允许标签溢出 */
.sd-chart-card {
  overflow: visible !important;
}

.sd-card::before,
.sd-chart-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(47, 111, 159, .15), transparent 40%, transparent 60%, rgba(47, 111, 159, .08));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.sd-card-title {
  margin: 0 0 6px;
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 1px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--glass-border);
  font-family: var(--font-sans);
}

/* 标题行（带装饰条） */
.sd-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sd-title-row .sd-card-title {
  margin-bottom: 6px;
  border-bottom: none;
  padding-bottom: 4px;
}

/* 蓝色装饰条（信号强度样式） */
.title-deco-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  padding-right: 2px;
}
.deco-bar {
  width: 3px;
  background: linear-gradient(to top, #2F6F9F, #0088cc);
  border-radius: 1px;
  opacity: .5;
}
.deco-bar:nth-child(1) { height: 40%; }
.deco-bar:nth-child(2) { height: 55%; }
.deco-bar:nth-child(3) { height: 35%; }
.deco-bar:nth-child(4) { height: 70%; }
.deco-bar:nth-child(5) { height: 50%; }
.deco-bar:nth-child(6) { height: 85%; }
.deco-bar:nth-child(7) { height: 60%; }
.deco-bar:nth-child(8) { height: 45%; }
.deco-bar:nth-child(9) { height: 75%; }
.deco-bar:nth-child(10) { height: 55%; }
.deco-bar:nth-child(11) { height: 90%; }
.deco-bar:nth-child(12) { height: 65%; }

/* 排行榜 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ranking-item {
  display: grid;
  grid-template-columns: 20px 62px 1fr 44px 36px;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 5px;
  transition: background .2s;
}

.ranking-item:hover {
  background: rgba(47, 111, 159, .06);
}

.rank-number {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  background: #1a3a5c;
  color: #8899aa;
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ffb300); color: #000; }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #000; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; }

.rank-city {
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 500;
  white-space: nowrap;
}

.rank-value {
  font-size: 10px;
  color: #94a3b8;
}

.rank-bar-wrapper {
  height: 6px;
  background: rgba(47, 111, 159, .1);
  border-radius: 3px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  border-radius: 3px;
  transition: width .6s ease;
}

.rank-bar--gold {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.rank-bar--blue {
  background: linear-gradient(90deg, #2F6F9F, #0891b2);
}

.rank-percent {
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  text-align: right;
}

/* 排行榜展开按钮 */
.ranking-expand-btn {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  background: rgba(47, 111, 159,.06);
  border: 1px dashed rgba(47, 111, 159,.2);
  border-radius: 5px;
  color: #7dd3fc;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s ease;
}
.ranking-expand-btn:hover {
  background: rgba(47, 111, 159,.12);
  border-color: rgba(47, 111, 159,.35);
  color: #2F6F9F;
}

/* 图表卡片 */
.sd-chart-card {
  min-height: 0;
  flex: 1;
}

.chart-legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend--yellow { background: #fbbf24; }
.legend--orange { background: #fd9644; }
.legend--cyan { background: #2F6F9F; }
.legend--blue { background: #a55eea; }

.legend-line {
  width: 16px;
  height: 2px;
  display: inline-block;
  border-radius: 1px;
}

.legend-line--gray { background: #636e72; }
.legend-line--orange { background: #fd9644; }
.legend-line--blue { background: #2F6F9F; }

.sd-chart-container {
  width: 100%;
  height: 100%;
  min-height: 150px;
}

.sd-chart-container--lg {
  height: 100%;
  min-height: 160px;
}

/* ===== 年份轮播数据卡片 ===== */
.sd-chart-card {
  position: relative;
  overflow: visible !important;
}

.year-data-card {
  position: absolute;
  z-index: 10;
  width: 115px;
  background: rgba(20,12,8,.94);
  border: 1px solid rgba(212,136,6,.35);
  border-radius: 6px;
  padding: 5px 9px;
  box-shadow: 0 4px 16px rgba(0,0,0,.5), 0 0 12px rgba(251,191,36,.1);
  pointer-events: none;
  transition: left .5s cubic-bezier(.4,2,.2,1), top .5s cubic-bezier(.4,2,.2,1), opacity .25s ease;
}
.ydc-year {
  font-size: 12px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 2px;
  letter-spacing: 1px;
}
.ydc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 1px 0;
  font-size: 10.5px;
}
.ydc-label { color: #a0826d; }
.ydc-val {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
.ydc-gold { color: #fbbf24; }
.ydc-cyan { color: #2F6F9F; }
.ydc-orange { color: #f59e0b; }
.ydc-red { color: #ef4444; }
.ydc-blue { color: #3b82f6; }

.data-card-fade-enter-active { transition: opacity .25s ease; }
.data-card-fade-leave-active { transition: opacity .15s ease; }
.data-card-fade-enter-from,
.data-card-fade-leave-to { opacity: 0; }

/* ===== 中央区域（与首页一致） ===== */
.sd-center-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow: visible;
  align-self: stretch;
}

.map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(6,12,24,.9) 0%, rgba(4,8,18,.95) 100%);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(56,189,248,.25);
  border-radius: var(--radius-lg);
  padding: var(--sp-md);
  /* ===== 3D悬浮层叠效果（原型图风格）===== */
  box-shadow:
    0 2px 0 rgba(56,189,248,.15),
    0 5px 0 rgba(56,189,248,.10),
    0 9px 0 rgba(56,189,248,.07),
    0 14px 0 rgba(56,189,248,.05),
    0 20px 0 rgba(56,189,248,.03),
    0 28px 20px rgba(0,0,0,.45),
    0 0 40px rgba(56,189,248,.08) inset;
  position: relative;
  overflow: visible;
  min-height: 0;
  /* 轻微3D透视 */
  transform-style: preserve-3d;
}

.map-section::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(56,189,248,.4), rgba(47, 111, 159,.15) 30%, transparent 50%, rgba(47, 111, 159,.10) 70%, rgba(56,189,248,.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
  /* 边框持续柔和发光，无闪烁 */
  opacity: .8;
  filter: drop-shadow(0 0 8px rgba(47, 111, 159, 0.25));
}

.map-main-title {
  margin: 0 0 2px;
  text-align: center;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--color-accent-warm);
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(251, 191, 36, .3);
  font-family: var(--font-sans);
}

.map-header {
  position: relative;
  z-index: 5;
}

.map-subtitle {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #a0826d;
  margin-bottom: 4px;
}

.year-selector-bottom {
  position: absolute;
  right: 16px;
  bottom: 100px;
  z-index: 10;
  display: flex;
  gap: 6px;
}

.year-chip {
  padding: 5px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-family: var(--font-sans);
}

.year-chip:hover {
  border-color: var(--glass-border-hover);
  color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.year-chip--active {
  background: linear-gradient(135deg, rgba(47, 111, 159, .25), rgba(47, 111, 159, .2));
  border-color: var(--border-glow-active);
  color: #fff;
  box-shadow: var(--shadow-glow);
}

/* 底部统计卡片 */
.stats-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(47, 111, 159, .12), transparent 50%, transparent 70%, rgba(47, 111, 159, .06));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md), var(--shadow-glow);
  border-color: var(--glass-border-hover);
}

.stat-icon { font-size: 22px; }

/* 底部圆形统计卡片（替换原方形卡片） */
.circular-stats-row {
  display: flex; justify-content: center; gap: 32px; margin-top: 10px;
}
.circle-stat {
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(47, 111, 159,.12), transparent 55%), radial-gradient(circle, rgba(6,8,14,.9), rgba(6,8,14,.95));
  border: 2px solid rgba(47, 111, 159,.3);
  box-shadow: 0 0 20px rgba(47, 111, 159,.12), inset 0 0 18px rgba(47, 111, 159,.06);
  display: flex; align-items: center; justify-content: center;
  transition: all .3s ease; position: relative; overflow: hidden;
}
.circle-stat::before {
  content: ''; position: absolute; inset: -2px; border-radius: 50%;
  background: conic-gradient(from 180deg, transparent 70%, rgba(47, 111, 159,.25), transparent 85%);
  animation: circleRotate 6s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: exclude; padding: 2px;
}
.circle-stat:hover { transform: translateY(-4px); box-shadow: 0 0 28px rgba(47, 111, 159,.22), inset 0 0 24px rgba(47, 111, 159,.1); border-color: rgba(47, 111, 159,.5); }
@keyframes circleRotate { to { transform: rotate(360deg); } }
.circle-stat--new { border-color: rgba(16,185,129,.3); box-shadow: 0 0 20px rgba(16,185,129,.12), inset 0 0 18px rgba(16,185,129,.06); }
.circle-stat--new::before { background: conic-gradient(from 180deg, transparent 70%, rgba(16,185,129,.25), transparent 85%); }
.circle-stat--new:hover { box-shadow: 0 0 28px rgba(16,185,129,.22), inset 0 0 24px rgba(16,185,129,.1); border-color: rgba(16,185,129,.5); }
.circle-stat--devices { border-color: rgba(251,191,36,.3); box-shadow: 0 0 20px rgba(251,191,36,.12), inset 0 0 18px rgba(251,191,36,.06); }
.circle-stat--devices::before { background: conic-gradient(from 180deg, transparent 70%, rgba(251,191,36,.25), transparent 85%); }
.circle-stat--devices:hover { box-shadow: 0 0 28px rgba(251,191,36,.22), inset 0 0 24px rgba(251,191,36,.1); border-color: rgba(251,191,36,.5); }
.circle-inner { text-align: center; z-index: 1; }
.circle-value { font-size: 20px; font-weight: 800; color: #e2e8f0; font-family: var(--font-number); line-height: 1.2; text-shadow: 0 0 10px rgba(47, 111, 159,.4); }
.circle-label { font-size: 10px; color: #94a3b8; margin-top: 2px; letter-spacing: 1px; }

/* ===== 右侧面板（与首页一致） ===== */
.sd-right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  align-self: stretch;
}

/* 趋势仪表盘 */
.sd-trend-card, .sd-pie-card, .sd-table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-md);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.sd-trend-card::before,
.sd-pie-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(47, 111, 159, .15), transparent 40%, transparent 60%, rgba(47, 111, 159, .08));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.sd-trend-card {
  cursor: pointer;
  transition: all var(--transition-normal);
}

.sd-trend-card:hover {
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-md), var(--shadow-glow);
}

.trend-gauges {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  margin-top: 10px;
}

.trend-gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.gauge-circle {
  position: relative;
  width: 90px;
  height: 95px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-svg {
  width: 90px;
  height: 90px;
  transform: rotate(0deg);
}

.gauge-progress {
  transition: stroke-dashoffset 1s ease;
}

.gauge-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 90px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.gauge-percent {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.gauge--up .gauge-percent { color: #2F6F9F; }
.gauge--down .gauge-percent { color: #ff4757; }

.gauge-trend-text {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
}

.gauge-trend--up { color: #2F6F9F; }
.gauge-trend--down { color: #ff4757; }

.gauge-scale-row {
  display: flex;
  justify-content: space-between;
  width: 90px;
  padding: 0 2px;
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
}

.gauge-city-name {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

/* ===== 资金使用分析环形图 ===== */
.sd-fund-container {
  width: 100%;
  height: 180px;
}

/* 资金图例（3列网格） */
.fund-legend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px 4px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,.06);
}

.fund-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: #94a3b8;
  cursor: pointer;
  transition: color .2s ease;
  white-space: nowrap;
  justify-content: center;
}

.fund-legend-item:hover {
  color: #e2e8f0;
}

.fund-legend-item--active {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(96,165,250,.5);
}

.fund-legend-item--active .fund-dot {
  box-shadow: 0 0 6px currentColor;
}

.fund-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* 表格 */
.brand-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.brand-table th {
  padding: 5px 4px;
  text-align: left;
  color: #2F6F9F;
  font-weight: 600;
  border-bottom: 1px solid rgba(47, 111, 159, .2);
  font-size: 10px;
}

.brand-table td {
  padding: 5px 4px;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(47, 111, 159, .08);
}

.brand-table tr:hover td {
  background: rgba(47, 111, 159, .04);
}

.brand-icon { margin-right: 4px; }

.text-danger { color: #ff4757; font-weight: 600; }

/* ===== 站点分布弹窗 ===== */
.station-dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(var(--glass-blur));
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn .2s ease;
}
.station-dialog {
  width: 640px;
  max-height: 70vh;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg), var(--shadow-glow-lg);
  display: flex;
  flex-direction: column;
  animation: slideUp .3s ease;
}
.station-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(90deg, rgba(47, 111, 159, .1), transparent);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}
.station-dialog-title {
  margin: 0;
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--color-primary);
  text-shadow: 0 0 10px rgba(47, 111, 159, .3);
  font-family: var(--font-sans);
}
.station-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(239, 68, 68, .15);
  color: #f87171;
  font-size: 16px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s ease;
}
.station-dialog-close:hover {
  background: rgba(239, 68, 68, .28);
  transform: scale(1.12);
}
.station-dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
}
.station-dialog-body::-webkit-scrollbar { width: 4px; }
.station-dialog-body::-webkit-scrollbar-thumb { background: rgba(47, 111, 159, .15); border-radius: 2px; }

.station-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.station-table th {
  padding: 10px 8px;
  text-align: left;
  color: #2F6F9F;
  font-weight: 600;
  border-bottom: 1px solid rgba(47, 111, 159, .18);
  font-size: 12px;
}
.station-table td {
  padding: 9px 8px;
  color: #c8e6f0;
  border-bottom: 1px solid rgba(47, 111, 159, .06);
}
.station-table tbody tr:hover td {
  background: rgba(47, 111, 159, .05);
}

.trend-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.trend-table th {
  padding: 10px 8px;
  text-align: left;
  color: #2F6F9F;
  font-weight: 600;
  border-bottom: 1px solid rgba(47, 111, 159, .18);
  font-size: 12px;
}
.trend-table td {
  padding: 9px 8px;
  color: #c8e6f0;
  border-bottom: 1px solid rgba(47, 111, 159, .06);
}
.trend-table tbody tr:hover td {
  background: rgba(47, 111, 159, .05);
}
.trend-count {
  color: #fbbf24;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(251, 191, 36, .2);
}
.trend-up {
  color: #ff4757;
  font-weight: 700;
}
.station-empty {
  text-align: center;
  padding: 40px 0;
  color: #5a8a9a;
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
