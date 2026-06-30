<template>
  <aside class="left-panel-prototype">
    <!-- 行政区选择 -->
    <GlassCard title="行政区选择（山东省）" icon="📍" class="panel-region" :animate="true" :animate-delay="0">
      <div class="region-search">
        <input
          type="text"
          placeholder="请输入州/区名称"
          class="region-input"
          v-model="searchText"
        />
        <span class="search-icon">&#128269;</span>
      </div>
      <ul class="region-tree">
        <li class="rt-item rt-item--province" :class="{ 'rt-item--selected': selectedRegion.type === 'province' }">
          <span class="rt-toggle" @click.stop="toggleProvince">▸</span>
          <span
            class="rt-label"
            :class="{ 'rt-label--active': selectedRegion.type === 'province', 'rt-label--clickable': true }"
            @click="selectProvince"
          >省份：山东省</span>
        </li>
        <template v-if="provinceExpanded">
          <li
            v-for="city in cities"
            :key="city.key"
            class="rt-item rt-item--city"
            :class="{ 'rt-item--selected': selectedRegion.type === 'city' && selectedRegion.name === city.name }"
          >
            <span
              :class="['rt-toggle', { 'rt-toggle--open': cityExpanded === city.key }]"
              @click.stop="toggleCity(city.key)"
            >▸</span>
            <span
              class="rt-label rt-label--clickable"
              :class="{ 'rt-label--active': selectedRegion.name === city.name }"
              @click.stop="selectCity(city.name)"
            >{{ city.name }}</span>
          </li>
          <template v-if="cityExpanded === 'jinan'">
            <li class="rt-item rt-item--district" :class="{ 'rt-item--selected': selectedRegion.type === 'county' && selectedRegion.name === '长清区' }">
              <span class="rt-indent"></span>
              <span class="rt-label rt-label--leaf rt-label--clickable" :class="{ 'rt-label--active': selectedRegion.name === '长清区' }" @click.stop="selectCounty('长清区')">长清区</span>
            </li>
            <li class="rt-item rt-item--district" :class="{ 'rt-item--selected': selectedRegion.type === 'county' && selectedRegion.name === '济阳区' }">
              <span class="rt-indent"></span>
              <span class="rt-label rt-label--leaf rt-label--clickable" :class="{ 'rt-label--active': selectedRegion.name === '济阳区' }" @click.stop="selectCounty('济阳区')">济阳区</span>
            </li>
            <li class="rt-item rt-item--district" :class="{ 'rt-item--selected': selectedRegion.type === 'county' && selectedRegion.name === '历城区' }">
              <span class="rt-indent"></span>
              <span class="rt-label rt-label--leaf rt-label--clickable" :class="{ 'rt-label--active': selectedRegion.name === '历城区' }" @click.stop="selectCounty('历城区')">历城区</span>
            </li>
          </template>
        </template>
      </ul>
    </GlassCard>

    <!-- 打诱虫量 -->
    <GlassCard class="panel-chart" :animate="true" :animate-delay="100">
      <template #header>
        <div class="panel-header">
          <button class="header-title-btn" @click.stop="openLightExpand" title="点击放大查看">灯诱虫量</button>
          <div class="chart-tabs">
            <button
              v-for="tab in pestTabs"
              :key="tab.key"
              :class="['chart-tab', { 'chart-tab--active': activeLightTab === tab.key }]"
              @click="activeLightTab = tab.key"
            >{{ tab.label }}</button>
          </div>
        </div>
      </template>
      <div class="chart-subtitle">
        <span>全省主要害虫监测网(取数)</span>
        <span class="light-month-badge">{{ months[lightMonthIndex] }}</span>
        <template v-for="(val, idx) in currentMonthValues" :key="idx">
          <span class="light-data-tag" :style="{ color: ['#f59e0b','#10b981','#3b82f6'][idx] }">{{ val }}</span>
        </template>
      </div>
      <div ref="lightChartRef" class="chart-container"></div>
    </GlassCard>

    <!-- 性诱虫置 -->
    <GlassCard class="panel-chart panel-chart--sex" :animate="true" :animate-delay="200">
      <template #header>
        <div class="panel-header">
          <div class="sex-header-left">
            <div class="sex-title-vertical">
              <span class="sex-title-icon">🔬</span>
              <span class="sex-title-text">性诱<br>虫置</span>
            </div>
            <button class="header-title-btn header-title-btn--sex" @click.stop="openSexExpand" title="点击放大查看">性诱虫量详情</button>
          </div>
          <div class="sex-header-right">
            <div class="chart-tabs">
              <button
                v-for="tab in pestTabs"
                :key="tab.key"
                :class="['chart-tab', { 'chart-tab--active': activeSexTab === tab.key }]"
                @click="activeSexTab = tab.key"
              >{{ tab.label }}</button>
            </div>
            <div class="time-unit-tabs">
              <button
                v-for="unit in sexTimeUnits"
                :key="unit.key"
                :class="['time-unit-tab', { 'time-unit-tab--active': activeSexTimeUnit === unit.key }]"
                @click="switchSexTimeUnit(unit.key)"
              >{{ unit.label }}</button>
            </div>
          </div>
        </div>
      </template>
      <div class="chart-subtitle">
        <span>全省主要害虫监测网(取数)</span>
        <span class="light-month-badge">{{ sexXLabels[activeSexTimeUnit][sexMonthIndex] }}</span>
        <template v-for="(val, idx) in currentSexMonthValues" :key="idx">
          <span class="light-data-tag" :style="{ color: ['#f59e0b','#10b981','#3b82f6'][idx] }">{{ val }}</span>
        </template>
      </div>
      <div ref="sexChartRef" class="chart-container"></div>
    </GlassCard>
  </aside>

  <!-- 全屏弹窗：灯诱虫量放大 -->
  <Teleport to="body">
    <Transition name="expand-fade">
      <div v-if="lightExpanded" class="expand-overlay" @click.self="closeLightExpand">
        <div class="expand-dialog">
          <div class="expand-header">
            <div class="expand-title-row">
              <span class="expand-icon">💡</span>
              <h3 class="expand-title">灯诱虫量分析</h3>
              <span class="expand-subtitle">全省主要害虫监测网</span>
            </div>
            <button class="expand-close" @click="closeLightExpand" title="关闭">✕</button>
          </div>
          <div class="expand-toolbar">
            <div class="chart-tabs">
              <button
                v-for="tab in pestTabs"
                :key="tab.key"
                :class="['chart-tab', { 'chart-tab--active': activeLightTab === tab.key }]"
                @click="activeLightTab = tab.key; refreshExpandedLight()"
              >{{ tab.label }}</button>
            </div>
            <div class="expand-legend">
              <span class="legend-item"><i class="legend-dot" style="background:#f59e0b"></i>粮棉虫</span>
              <span class="legend-item"><i class="legend-dot" style="background:#10b981"></i>玉米螟</span>
              <span class="legend-item"><i class="legend-dot" style="background:#3b82f6"></i>蝗虫</span>
            </div>
          </div>
          <div class="expand-chart-wrap">
            <div ref="expandedLightChartRef" class="expanded-canvas"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 全屏弹窗：性诱虫置放大 -->
  <Teleport to="body">
    <Transition name="expand-fade">
      <div v-if="sexExpanded" class="expand-overlay expand-overlay--sex" @click.self="closeSexExpand">
        <div class="expand-dialog">
          <div class="expand-header">
            <div class="expand-title-row">
              <span class="expand-icon">🔬</span>
              <h3 class="expand-title">性诱虫量分析</h3>
              <span class="expand-subtitle">全省主要害虫监测网</span>
            </div>
            <button class="expand-close" @click="closeSexExpand" title="关闭">✕</button>
          </div>
          <div class="expand-toolbar">
            <div class="chart-tabs">
              <button
                v-for="tab in pestTabs"
                :key="tab.key"
                :class="['chart-tab', { 'chart-tab--active': activeSexTab === tab.key }]"
                @click="activeSexTab = tab.key; refreshExpandedSex()"
              >{{ tab.label }}</button>
            </div>
            <div class="time-unit-tabs">
              <button
                v-for="unit in sexTimeUnits"
                :key="unit.key"
                :class="['time-unit-tab', { 'time-unit-tab--active': activeSexTimeUnit === unit.key }]"
                @click="switchSexTimeUnit(unit.key); refreshExpandedSex()"
              >{{ unit.label }}</button>
            </div>
            <div class="expand-legend">
              <span class="legend-item"><i class="legend-dot" style="background:#f59e0b"></i>粮棉虫</span>
              <span class="legend-item"><i class="legend-dot" style="background:#10b981"></i>玉米螟</span>
              <span class="legend-item"><i class="legend-dot" style="background:#3b82f6"></i>蝗虫</span>
            </div>
          </div>
          <div class="expand-chart-wrap">
            <div ref="expandedSexChartRef" class="expanded-canvas"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from '@/utils/echarts'
import GlassCard from '@/components/ui/GlassCard.vue'
import {
  CITY_TREE, CITY_KEY_TO_NAME,
  PEST_TABS_LEFT,
  MONTHS_LABELS,
  CHART_DATA_MAP,
  SEX_TIME_UNITS, SEX_X_LABELS, SEX_DATA_BY_UNIT,
  type SexTimeUnit
} from '@/constants/mockData'

const emit = defineEmits<{
  (e: 'region-change', data: any): void
  (e: 'region-select', data: { type: 'province' | 'city' | 'county'; name: string; parentCity?: string }): void
}>()

// ===== 行政区树 =====
const searchText = ref('')
const provinceExpanded = ref(true)
const cityExpanded = ref<string | null>('jinan')
const selectedRegion = ref<{ type: 'province' | 'city' | 'county'; name: string }>({ type: 'province', name: '山东省' })

// 使用标准化城市数据（从 mockData.ts）
const cities = CITY_TREE

const cityNames = CITY_KEY_TO_NAME

function toggleProvince() {
  provinceExpanded.value = !provinceExpanded.value
}
function toggleCity(city: string) {
  cityExpanded.value = cityExpanded.value === city ? null : city
  selectCity(cityNames[city] || city)
}
function selectProvince() {
  selectedRegion.value = { type: 'province', name: '山东省' }
  emit('region-select', { type: 'province', name: '山东省' })
  emit('region-change', { province: '山东省', city: '', district: '', fullName: '山东省' })
}
function selectCity(cityName: string) {
  selectedRegion.value = { type: 'city', name: cityName }
  emit('region-select', { type: 'city', name: cityName })
  emit('region-change', { province: '山东省', city: cityName, district: '', fullName: `山东省/${cityName}` })
}
function selectCounty(countyName: string) {
  selectedRegion.value = { type: 'county', name: countyName }
  const parentCity = cityNames[cityExpanded.value || 'jinan'] || '济南市'
  emit('region-select', { type: 'county', name: countyName, parentCity })
  emit('region-change', { province: '山东省', city: parentCity, district: countyName, fullName: `山东省/${parentCity}/${countyName}` })
}

// 使用标准化虫种 Tab（从 mockData.ts）
const pestTabs = PEST_TABS_LEFT
const activeLightTab = ref('grainCotton')
const activeSexTab = ref('grainCotton')

// ===== 灯诱虫量月份自动轮播 =====
const lightMonthIndex = ref(0)
let lightTimer: ReturnType<typeof setInterval> | null = null

// ===== 性诱虫置月份自动轮播 =====
const sexMonthIndex = ref(0)
let sexTimer: ReturnType<typeof setInterval> | null = null

// ===== 全屏弹窗状态 =====
const lightExpanded = ref(false)
const sexExpanded = ref(false)
const expandedLightChartRef = ref<HTMLElement>()
const expandedSexChartRef = ref<HTMLElement>()
let expandedLightChart: echarts.ECharts | null = null
let expandedSexChart: echarts.ECharts | null = null

/** 打开灯诱虫量全屏弹窗 */
async function openLightExpand() {
  lightExpanded.value = true
  await nextTick()
  setTimeout(() => initExpandedLightChart(), 100)
}

/** 关闭灯诱虫量全屏弹窗 */
function closeLightExpand() {
  lightExpanded.value = false
  if (expandedLightChart) { expandedLightChart.dispose(); expandedLightChart = null }
}

/** 打开性诱虫置全屏弹窗 */
async function openSexExpand() {
  sexExpanded.value = true
  await nextTick()
  setTimeout(() => initExpandedSexChart(), 100)
}

/** 关闭性诱虫置全屏弹窗 */
function closeSexExpand() {
  sexExpanded.value = false
  if (expandedSexChart) { expandedSexChart.dispose(); expandedSexChart = null }
}

/** 初始化灯诱放大图表 */
function initExpandedLightChart() {
  if (!expandedLightChartRef.value) return
  expandedLightChart = echarts.init(expandedLightChartRef.value, 'plantProtection')
  expandedLightChart.setOption(getLightChartOption(activeLightTab.value, true))
}

/** 初始化性诱放大图表 */
function initExpandedSexChart() {
  if (!expandedSexChartRef.value) return
  expandedSexChart = echarts.init(expandedSexChartRef.value, 'plantProtection')
  expandedSexChart.setOption(getSexChartOption(activeSexTab.value, true))
}

/** 刷新灯诱放大图表（tab切换时） */
function refreshExpandedLight() {
  if (expandedLightChart) {
    expandedLightChart.setOption(getLightChartOption(activeLightTab.value, true), true)
  }
}

/** 刷新性诱放大图表（tab/时间单位切换时） */
function refreshExpandedSex() {
  if (expandedSexChart) {
    expandedSexChart.setOption(getSexChartOption(activeSexTab.value, true), true)
  }
}

/** 性诱虫置时间单位切换（日/侯/周）— 使用标准化数据 */
const activeSexTimeUnit = ref<SexTimeUnit>('day')
const sexTimeUnits = SEX_TIME_UNITS

/** 时间单位对应的 X 轴标签 — 使用标准化数据 */
const sexXLabels = SEX_X_LABELS

/** 三种时间单位 × 三种虫种的性诱数据 — 使用标准化数据 */
const sexDataByUnit = SEX_DATA_BY_UNIT

/** 获取当前时间单位下某虫种的数据 */
function getSexData(key: string): number[] {
  return sexDataByUnit[key]?.[activeSexTimeUnit.value] ?? sexDataByUnit.grainCotton.day
}

function switchSexTimeUnit(unit: SexTimeUnit) {
  activeSexTimeUnit.value = unit
  if (sexChart) sexChart.setOption(getSexChartOption(activeSexTab.value))
}

/** 当前月份各虫种的灯诱数据值 */
const currentMonthValues = computed(() => {
  const mi = lightMonthIndex.value
  return [
    chartDataMap.grainCotton.light[mi],
    chartDataMap.cornBorer.light[mi],
    chartDataMap.locust.light[mi]
  ]
})

/** 当前时间单位各虫种的性诱数据值 */
const currentSexMonthValues = computed(() => {
  const mi = sexMonthIndex.value
  return [
    getSexData('grainCotton')[mi],
    getSexData('cornBorer')[mi],
    getSexData('locust')[mi]
  ]
})

// ===== 图表 =====
const lightChartRef = ref<HTMLElement>()
const sexChartRef = ref<HTMLElement>()
let lightChart: echarts.ECharts | null = null
let sexChart: echarts.ECharts | null = null

// 使用标准化月份数据（从 mockData.ts）
const months = MONTHS_LABELS

// 使用标准化图表数据（从 mockData.ts）
const chartDataMap = CHART_DATA_MAP

/** 构建折线图配置（灯诱/性诱共用） */
function buildLineChartOption(opts: {
  monthIndex: number
  xLabels: string[]
  getData: (key: string) => number[]
  yMax: number
  yInterval: number
  large?: boolean
  activeKey?: string
}) {
  const { monthIndex: mi, xLabels, getData, yMax, yInterval, large = false, activeKey } = opts
  const allKeys = ['grainCotton', 'cornBorer', 'locust']
  const fontSize = large ? 13 : 9
  const labelFontSize = large ? 14 : 11

  return {
    grid: large ? { top: 50, right: 30, bottom: 40, left: 60 } : { top: 28, right: 14, bottom: 26, left: 38 },
    legend: { show: false },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8,32,48,.95)',
      borderColor: 'rgba(47, 111, 159,.25)',
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: '#e0f2fe', fontSize: large ? 13 : 11 }
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: 'rgba(47, 111, 159,.15)' } },
      axisTick: { show: false },
      axisLabel: {
        color: (idx: number) => idx === mi ? '#fbbf24' : '#7dd3fc',
        fontSize,
        interval: 1,
        fontWeight: (idx: number) => idx === mi ? 'bold' as any : 'normal' as any
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      interval: yInterval,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(47, 111, 159,.06)', type: 'dashed' } },
      axisLabel: { color: '#7dd3fc', fontSize }
    },
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed', opacity: 0.6 },
      data: [{ xAxis: xLabels[mi] }]
    },
    series: allKeys.map((key, i) => {
      const colors = [
        { line: '#f59e0b', area: 'rgba(245,158,11,0.08)' },
        { line: '#10b981', area: 'rgba(16,185,129,0.08)' },
        { line: '#3b82f6', area: 'rgba(59,130,246,0.08)' }
      ]
      const seriesData = getData(key)
      // ★ 根据选中的虫种决定是否高亮
      const isActive = !activeKey || activeKey === key
      return {
        name: pestTabs[i].label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: (val: number[], params: any) => params.dataIndex === mi ? (large ? 12 : 8) : (large ? 5 : 3),
        data: seriesData,
        lineStyle: {
          color: colors[i].line,
          width: isActive ? (large ? 2.5 : 2) : 1,
          opacity: isActive ? 1 : 0.2
        },
        itemStyle: {
          color: colors[i].line,
          borderColor: (params: any) => params.dataIndex === mi ? '#fff' : 'transparent',
          borderWidth: (params: any) => params.dataIndex === mi ? 2 : 0,
          opacity: isActive ? 1 : 0.3
        },
        areaStyle: isActive ? { color: colors[i].area } : { color: 'transparent' },
        label: {
          show: isActive,
          position: 'top',
          formatter: (params: any) =>
            params.dataIndex === mi ? String(params.value ?? '') : '',
          color: colors[i].line,
          fontSize: labelFontSize,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowBlur: 4,
          offset: [0, large ? -10 : -6]
        },
        markPoint: {
          silent: true,
          symbol: 'circle',
          symbolSize: large ? 36 : 24,
          itemStyle: { color: colors[i].line, opacity: isActive ? 0.18 : 0.05 },
          data: [{ coord: [xLabels[mi], seriesData[mi]] }]
        }
      }
    })
  }
}

function getLightChartOption(tabKey: string, large = false) {
  return buildLineChartOption({
    monthIndex: lightMonthIndex.value,
    xLabels: months,
    getData: (key: string) => chartDataMap[key].light,
    yMax: 350,
    yInterval: 70,
    large,
    activeKey: tabKey
  })
}

function getSexChartOption(tabKey: string, large = false) {
  return buildLineChartOption({
    monthIndex: sexMonthIndex.value,
    xLabels: sexXLabels[activeSexTimeUnit.value],
    getData: (key: string) => getSexData(key),
    yMax: ({ day: 120, hou: 300, week: 520 } as Record<string, number>)[activeSexTimeUnit.value],
    yInterval: ({ day: 24, hou: 60, week: 104 } as Record<string, number>)[activeSexTimeUnit.value],
    large,
    activeKey: tabKey
  })
}

/** 向前推进一个月（灯诱） */
function advanceMonth() {
  lightMonthIndex.value = (lightMonthIndex.value + 1) % 12
  if (lightChart) {
    lightChart.setOption(getLightChartOption(activeLightTab.value))
  }
}

/** 向前推进一个月（性诱） */
function advanceSexMonth() {
  sexMonthIndex.value = (sexMonthIndex.value + 1) % 12
  if (sexChart) {
    sexChart.setOption(getSexChartOption(activeSexTab.value))
  }
}

/** 启动/停止轮播 */
function startLightTimer() { stopLightTimer(); lightTimer = setInterval(advanceMonth, 2000) }
function stopLightTimer() { if (lightTimer !== null) { clearInterval(lightTimer); lightTimer = null } }

function startSexTimer() { stopSexTimer(); sexTimer = setInterval(advanceSexMonth, 2000) }
function stopSexTimer() { if (sexTimer !== null) { clearInterval(sexTimer); sexTimer = null } }

function initCharts() {
  if (lightChartRef.value) {
    lightChart = echarts.init(lightChartRef.value, 'plantProtection')
    lightChart.setOption(getLightChartOption(activeLightTab.value))
  }
  if (sexChartRef.value) {
    sexChart = echarts.init(sexChartRef.value, 'plantProtection')
    sexChart.setOption(getSexChartOption(activeSexTab.value))
  }
}

watch(activeLightTab, () => {
  if (lightChart) lightChart.setOption(getLightChartOption(activeLightTab.value))
})
watch(activeSexTab, () => {
  if (sexChart) sexChart.setOption(getSexChartOption(activeSexTab.value))
})

function handleResize() {
  lightChart?.resize()
  sexChart?.resize()
}

onMounted(() => {
  setTimeout(() => initCharts(), 150)
  window.addEventListener('resize', handleResize)
  startLightTimer()
  startSexTimer()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopLightTimer()
  stopSexTimer()
  lightChart?.dispose()
  sexChart?.dispose()
  if (expandedLightChart) { expandedLightChart.dispose(); expandedLightChart = null }
  if (expandedSexChart) { expandedSexChart.dispose(); expandedSexChart = null }
})

defineExpose({
  getSelectedRegion: () => selectedRegion.value,
  setSelectedRegion: (type: 'province' | 'city' | 'county', name: string) => {
    selectedRegion.value = { type, name }
    if (type === 'city' || type === 'county') {
      provinceExpanded.value = true
      const key = Object.keys(cityNames).find(k => cityNames[k] === name)
      if (key) cityExpanded.value = key
    }
    if (type === 'county') {
      provinceExpanded.value = true
    }
  },
  refreshCharts: () => initCharts()
})
</script>

<style scoped>
.left-panel-prototype {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  overflow-y: auto;
  padding-right: 3px;
  scrollbar-width: thin;
  scrollbar-color: rgba(47, 111, 159,.12) transparent;
}
.left-panel-prototype::-webkit-scrollbar { width: 3px; }
.left-panel-prototype::-webkit-scrollbar-thumb { background: rgba(47, 111, 159,.12); border-radius: 2px; }

.panel-region {
  flex-shrink: 0;
  max-height: 120px;
  overflow: hidden;
}

.panel-region :deep(.glass-card__header) {
  padding: 4px 8px;
}

.panel-region :deep(.glass-card__title) {
  font-size: 12px;
}

.panel-region :deep(.glass-card__body) {
  overflow-y: auto;
  max-height: 80px;
  padding: 4px 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 212, 170, 0.15) transparent;
}
.panel-region :deep(.glass-card__body::-webkit-scrollbar) { width: 3px; }
.panel-region :deep(.glass-card__body::-webkit-scrollbar-thumb) { background: rgba(0, 212, 170, 0.15); border-radius: 2px; }

.panel-chart {
  flex: 1;
  min-height: 140px;
}

/* ===== 行政区搜索 ===== */
.region-search {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  background: rgba(0,20,35,.55);
  border: 1px solid rgba(47, 111, 159,.15);
  border-radius: 4px;
  padding: 0 8px;
  transition: border-color var(--transition-fast);
}
.region-search:focus-within {
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glow);
}
.region-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  padding: 5px 0;
  font-family: var(--font-sans);
}
.region-input::placeholder { color: var(--text-muted); }
.search-icon {
  font-size: 13px;
  opacity: .5;
  cursor: pointer;
}

/* ===== 区域树 ===== */
.region-tree {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(47, 111, 159,.12) transparent;
}
.region-tree::-webkit-scrollbar { width: 3px; }
.region-tree::-webkit-scrollbar-thumb { background: rgba(47, 111, 159,.12); border-radius: 2px; }
.rt-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: default;
  transition: background var(--transition-fast);
}
.rt-item:hover { background: rgba(47, 111, 159,.04); }
.rt-item--selected {
  background: rgba(47, 111, 159,.1);
  border-radius: 3px;
}

.rt-toggle {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  width: 14px;
  flex-shrink: 0;
  transition: transform .15s ease;
  display: inline-block;
  text-align: center;
}
.rt-toggle--open { transform: rotate(90deg); }

.rt-label {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  font-weight: 500;
  font-family: var(--font-sans);
}
.rt-label--clickable {
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: 2px;
  padding: 1px 3px;
  margin: -1px -3px;
}
.rt-label--clickable:hover {
  color: var(--color-primary);
  text-shadow: 0 0 6px rgba(47, 111, 159,.3);
  background: rgba(47, 111, 159,.06);
}
.rt-label--active {
  color: var(--color-primary);
  font-weight: 700;
  text-shadow: 0 0 8px rgba(47, 111, 159,.35);
}
.rt-label--leaf {
  color: var(--text-muted);
  font-size: 11px;
  padding-left: 4px;
}
.rt-indent {
  width: 18px;
  flex-shrink: 0;
}

/* ===== 图表 ===== */
.chart-subtitle {
  padding: 0 0 4px;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  gap: 8px;
}

.light-month-badge {
  padding: 1px 8px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  color: #fbbf24;
  font-size: 11px;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

.light-data-tag {
  padding: 1px 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
}

/* ===== 图表卡片通用样式 ===== */
.chart-tabs {
  display: flex;
  gap: 3px;
}
.chart-tab {
  padding: 2px 10px;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 11px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.chart-tab:hover { background: rgba(47, 111, 159,.08); color: var(--color-primary); }
.chart-tab--active {
  background: linear-gradient(135deg, rgba(47, 111, 159,.18), rgba(47, 111, 159,.12));
  border-color: var(--border-glow-active);
  color: #fff;
  box-shadow: var(--shadow-glow);
}

/* ===== 性诱虫置：竖排标题 + 右侧控制区 ===== */
.panel-chart--sex :deep(.glass-card__header) {
  padding: 4px 8px;
  background: linear-gradient(90deg, rgba(0, 212, 170, 0.08), transparent 60%);
}

.sex-card-header {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.sex-title-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  width: 32px;
  padding: 4px 2px;
  background: rgba(47, 111, 159,0.06);
  border: 1px solid rgba(47, 111, 159,0.15);
  border-radius: var(--radius-sm);
}

.sex-title-icon {
  font-size: 14px;
  line-height: 1;
}

.sex-title-text {
  font-size: 13px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 2px;
  line-height: 1.25;
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: var(--font-sans);
  text-shadow: 0 0 8px rgba(47, 111, 159,0.3);
}

.sex-header-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* ===== 性诱虫置时间单位切换（在 sex-header-right 内） ===== */
.time-unit-tabs {
  display: flex;
  gap: 3px;
  margin-left: 0;
  padding-left: 0;
  border-left: none;
}
.time-unit-tab {
  padding: 2px 9px;
  background: transparent;
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 12px;
  color: rgba(251,191,36,0.6);
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}
.time-unit-tab:hover {
  background: rgba(245,158,11,0.08);
  color: #fbbf24;
  border-color: rgba(245,158,11,0.45);
}
.time-unit-tab--active {
  background: linear-gradient(135deg, rgba(245,158,11,.22), rgba(245,158,11,.12));
  border-color: #f59e0b;
  color: #fbbf24;
  box-shadow: 0 0 8px rgba(245,158,11,0.2), inset 0 0 6px rgba(245,158,11,0.06);
}

/* ===== 灯诱虫量标题栏优化 ===== */
.panel-chart:not(.panel-chart--sex) :deep(.glass-card__header) {
  padding: 5px 8px;
}

.panel-chart:not(.panel-chart--sex) :deep(.glass-card__title) {
  font-size: 12px;
  gap: 4px;
}

.panel-chart:not(.panel-chart--sex) :deep(.glass-card__icon) {
  font-size: 13px;
}

/* ===== 副标题行 ===== */
.chart-subtitle {
  padding: 2px 2px 2px;
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
  line-height: 1.4;
}

.light-month-badge {
  padding: 1px 7px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  color: #fbbf24;
  font-size: 11px;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

/* ===== 图表容器 ===== */
.chart-container {
  flex: 1;
  min-height: 0;
  margin-top: 2px;
}

/* 图表卡片内容区 */
.panel-chart :deep(.glass-card__body) {
  padding: 4px 6px 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 面板头部（标题按钮 + Tab） ===== */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.sex-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 标题按钮（可点击放大） */
.header-title-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-sans);
  cursor: pointer;
  padding: 2px 0;
  transition: all var(--transition-fast);
  letter-spacing: 0.5px;
}

.header-title-btn:hover {
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.header-title-btn--sex {
  color: #ec4899;
  font-size: 12px;
}

.header-title-btn--sex:hover {
  color: #f472b6;
  text-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
}

/* ===== 全屏遮罩弹窗 ===== */
.expand-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(6, 8, 16, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-overlay--sex {
  background: rgba(16, 6, 14, 0.88);
}

.expand-dialog {
  width: 82vw;
  max-width: 1100px;
  height: 76vh;
  background: linear-gradient(165deg, rgba(6, 20, 32, .98), rgba(8, 16, 28, .98) 50%, rgba(6, 14, 24, .98));
  border: 1px solid rgba(47, 111, 159, 0.25);
  border-radius: var(--radius-xl);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(47, 111, 159, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.expand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(90deg, rgba(47, 111, 159, 0.08), transparent 70%);
  border-bottom: 1px solid rgba(47, 111, 159, 0.12);
  flex-shrink: 0;
}

.expand-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  font-size: 22px;
}

.expand-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  font-family: var(--font-sans);
  letter-spacing: 1px;
}

.expand-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(47, 111, 159, 0.15);
}

.expand-close {
  width: 34px;
  height: 34px;
  border: none;
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-accent-red);
  font-size: 18px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  line-height: 1;
  flex-shrink: 0;
}

.expand-close:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(1.1);
}

/* 弹窗工具栏 */
.expand-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  border-bottom: 1px solid rgba(47, 111, 159, 0.08);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.expand-toolbar .chart-tab {
  padding: 4px 14px;
  font-size: 13px;
}

.expand-toolbar .time-unit-tab {
  padding: 3px 12px;
  font-size: 13px;
}

.expand-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

/* 放大图表容器 */
.expand-chart-wrap {
  flex: 1;
  min-height: 0;
  padding: 16px 24px;
  overflow: hidden;
}

.expanded-canvas {
  width: 100%;
  height: 100%;
}

/* 弹窗动画 */
.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: opacity 0.3s ease;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
}
</style>