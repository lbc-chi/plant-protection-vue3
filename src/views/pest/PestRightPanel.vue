<template>
  <aside class="pest-right-panel">
    <div class="panel-content">
      <!-- Section 1: 气象叠加分析 -->
      <section class="panel-section">
        <h3 class="section-title">
          <span class="title-icon">🌡️</span>
          气象叠加分析
        </h3>
        <p class="section-subtitle">防区预警研判建议</p>
        <div class="chart-legend">
          <span class="legend-item"><i class="legend-dot" style="background:#f59e0b"></i>虫害</span>
          <span class="legend-item"><i class="legend-line" style="background:#3b82f6"></i>温度</span>
          <span class="legend-item"><i class="legend-line" style="background:#06b6d4"></i>湿度</span>
          <span class="legend-item"><i class="legend-bar" style="background:#9ca3af"></i>降雨</span>
        </div>
        <div class="chart-wrapper">
          <div ref="weatherChartRef" class="chart-container"></div>
          <div v-if="weatherCardVisible" class="weather-data-card"
               :style="{ left: weatherCardPos.x + 'px', top: weatherCardPos.y + 'px' }">
            <div class="wdc-month">{{ months[weatherMonthIndex] }}</div>
            <div class="wdc-row"><span class="wdc-label">虫害</span><span class="wdc-val wdc-pest">{{ currentWeatherData.pest }}</span></div>
            <div class="wdc-row"><span class="wdc-label">温度</span><span class="wdc-val wdc-temp">{{ currentWeatherData.temp }}°C</span></div>
            <div class="wdc-row"><span class="wdc-label">湿度</span><span class="wdc-val wdc-humi">{{ currentWeatherData.humidity }}%</span></div>
            <div class="wdc-row"><span class="wdc-label">降雨</span><span class="wdc-val wdc-rain">{{ currentWeatherData.rainfall }}mm</span></div>
          </div>
        </div>
      </section>

      <!-- Section 2: 灯诱/性诱数据对比 -->
      <section class="panel-section">
        <h3 class="section-title">
          <span class="title-icon">📊</span>
          灯诱/性诱数据对比
        </h3>
        <div class="chart-legend">
          <span class="legend-item"><i class="legend-line" style="background:#f59e0b"></i>历下区宋家柳村性诱</span>
          <span class="legend-item"><i class="legend-line" style="background:#06b6d4"></i>历下区宋家柳村灯诱</span>
        </div>
        <div class="chart-wrapper">
          <div ref="compareChartRef" class="chart-container"></div>
          <div v-if="compareCardVisible" class="compare-data-card"
               :style="{ left: compareCardPos.x + 'px', top: compareCardPos.y + 'px' }">
            <div class="cdc-month">{{ months[compareMonthIndex] }}</div>
            <div class="cdc-row"><span class="cdc-label">性诱</span><span class="cdc-val cdc-sex">{{ currentCompareData.sexLure }}</span></div>
            <div class="cdc-row"><span class="cdc-label">灯诱</span><span class="cdc-val cdc-spray">{{ currentCompareData.spray }}</span></div>
          </div>
        </div>
      </section>

      <!-- Section 3: 预警灯图片 -->
      <section class="panel-section">
        <div class="section-header-row">
          <h3 class="section-title">
            <span class="title-icon">📸</span>
            预警灯图片
          </h3>
          <label class="toggle-label">
            <span class="toggle-text">只看生虫</span>
            <input type="checkbox" v-model="onlyShowPest" class="toggle-input" />
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="region-tag">历下区预警灯诱</div>
        <div class="image-grid">
          <div
            v-for="(img, i) in warningImages"
            :key="'warn-' + i"
            class="gallery-thumb"
            @click="handleImageClick(img, i)"
            @mouseenter="hoveredImage = i"
            @mouseleave="hoveredImage = null"
          >
            <div class="thumb-visual" :style="{ background: img.gradient }">
              <span class="thumb-icon">{{ img.icon }}</span>
            </div>
            <div v-if="hoveredImage === i" class="thumb-overlay">
              <span>查看</span>
            </div>
            <div class="thumb-label">{{ img.label }}</div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from '@/utils/echarts'

interface WarningImage {
  label: string
  icon: string
  gradient: string
}

const emit = defineEmits<{
  (e: 'image-click', image: WarningImage, index: number): void
}>()

const weatherChartRef = ref<HTMLDivElement>()
const compareChartRef = ref<HTMLDivElement>()
let weatherChart: echarts.ECharts | null = null
let compareChart: echarts.ECharts | null = null

// ===== 气象叠加分析 - 月份轮播 Timer =====
const weatherMonthIndex = ref(0)
const weatherCardVisible = ref(false)
const weatherCardPos = ref({ x: 0, y: 0 })
let weatherTimer: ReturnType<typeof setInterval> | null = null

const currentWeatherData = computed(() => ({
  pest: pestData[weatherMonthIndex.value],
  temp: tempData[weatherMonthIndex.value],
  humidity: humidityData[weatherMonthIndex.value],
  rainfall: rainfallData[weatherMonthIndex.value]
}))

function advanceWeatherMonth() {
  weatherMonthIndex.value = (weatherMonthIndex.value + 1) % months.length
  refreshWeatherHighlight()
  nextTick(() => setTimeout(updateWeatherCardPosition, 80))
}

function refreshWeatherHighlight() {
  if (!weatherChart) return

  // X轴标签高亮当前月
  const axisLabels = months.map((m, i) => ({
    value: m,
    textStyle: {
      color: i === weatherMonthIndex.value ? '#fbbf24' : '#d4a574',
      fontSize: i === weatherMonthIndex.value ? 12 : 10,
      fontWeight: (i === weatherMonthIndex.value ? 'bold' : 'normal') as any
    }
  }))

  const mi = weatherMonthIndex.value

  // 虫害折线：当前月放大点 + 标签
  const pestSeries = pestData.map((v, i) => ({
    value: v,
    symbolSize: i === mi ? 9 : 4,
    itemStyle: {
      color: '#f59e0b',
      borderColor: i === mi ? '#fff' : 'transparent',
      borderWidth: i === mi ? 2 : 0
    },
    label: { show: i === mi, position: 'top', color: '#fbbf24', fontSize: 11, fontWeight: 'bold' as any }
  }))

  // 温度/湿度：当前月稍大
  const makeLineData = (data: number[], color: string) =>
    data.map((v, i) => ({
      value: v,
      symbolSize: i === mi ? 6 : 3,
      itemStyle: { color, borderColor: i === mi ? 'rgba(255,255,255,.5)' : 'transparent', borderWidth: i === mi ? 1 : 0 }
    }))

  // 降雨柱状图：当前月加粗
  const rainSeries = rainfallData.map((v, i) => ({
    value: v,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: i === mi ? 'rgba(156,163,175,0.7)' : 'rgba(156,163,175,0.5)' },
        { offset: 1, color: i === mi ? 'rgba(156,163,175,0.35)' : 'rgba(156,163,175,0.15)' }
      ])
    }
  }))

  weatherChart.setOption({
    xAxis: { data: months, axisLabel: { formatter: (_val: unknown, idx: number) => ({ ...axisLabels[idx] }) as any } },
    series: [
      { data: pestSeries },
      { data: makeLineData(tempData, '#3b82f6') },
      { data: makeLineData(humidityData, '#06b6d4') },
      { data: rainSeries },
      // 当前月垂直标记线
      {
        name: 'markLine',
        type: 'line',
        data: [null, null, null, null, null, null, null, null, null, null, null, null],
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'rgba(251,191,36,0.45)', width: 1.5, type: 'dashed' as const },
          data: [{ xAxis: mi }]
        }
      },
      // 光晕效果
      {
        name: 'glow',
        type: 'effectScatter',
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 2.5, period: 3 },
        symbolSize: 8,
        data: [{ value: [mi, pestData[mi]] }],
        itemStyle: { color: '#f59e0b', shadowBlur: 6, shadowColor: 'rgba(245,158,11,0.35)' },
        z: 99
      }
    ]
  }, { lazyUpdate: true })
}

function updateWeatherCardPosition() {
  if (!weatherChart) return
  const mi = weatherMonthIndex.value
  const pixel = weatherChart.convertToPixel('grid', [mi, pestData[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    weatherCardPos.value = { x: pixel[0] + 14, y: pixel[1] - 16 }
  }
}

const onlyShowPest = ref(false)
const hoveredImage = ref<number | null>(null)

// ===== 打喷/性诱对比 - 月份轮播 Timer =====
const compareMonthIndex = ref(0)
const compareCardVisible = ref(false)
const compareCardPos = ref({ x: 0, y: 0 })
let compareTimer: ReturnType<typeof setInterval> | null = null

const currentCompareData = computed(() => ({
  sexLure: sexLureData[compareMonthIndex.value],
  spray: sprayData[compareMonthIndex.value]
}))

function advanceCompareMonth() {
  compareMonthIndex.value = (compareMonthIndex.value + 1) % months.length
  refreshCompareHighlight()
  nextTick(() => setTimeout(updateCompareCardPosition, 80))
}

function refreshCompareHighlight() {
  if (!compareChart) return
  const mi = compareMonthIndex.value

  // X轴标签高亮当前月
  const axisLabels = months.map((m, i) => ({
    value: m,
    textStyle: {
      color: i === mi ? '#fbbf24' : '#d4a574',
      fontSize: i === mi ? 12 : 10,
      fontWeight: (i === mi ? 'bold' : 'normal') as any
    }
  }))

  // 性诱折线：当前月放大点 + 标签
  const sexSeries = sexLureData.map((v, i) => ({
    value: v,
    symbolSize: i === mi ? 9 : 4,
    itemStyle: { color: '#f59e0b', borderColor: i === mi ? '#fff' : 'transparent', borderWidth: i === mi ? 2 : 0 },
    label: { show: i === mi, position: 'top', color: '#fbbf24', fontSize: 11, fontWeight: 'bold' as any }
  }))

  // 灯诱折线：当前月稍大
  const spraySeries = sprayData.map((v, i) => ({
    value: v,
    symbolSize: i === mi ? 7 : 4,
    itemStyle: { color: '#06b6d4', borderColor: i === mi ? 'rgba(255,255,255,.5)' : 'transparent', borderWidth: i === mi ? 1 : 0 }
  }))

  compareChart.setOption({
    xAxis: { data: months, axisLabel: { formatter: (_val: unknown, idx: number) => ({ ...axisLabels[idx] }) as any } },
    series: [
      { data: sexSeries },
      { data: spraySeries },
      // 当前月垂直标记线
      {
        name: 'markLine',
        type: 'line',
        data: Array(12).fill(null),
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'rgba(251,191,36,0.45)', width: 1.5, type: 'dashed' as const },
          data: [{ xAxis: mi }]
        }
      },
      // 光晕效果（性诱数据点）
      {
        name: 'glow',
        type: 'effectScatter',
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 2.5, period: 3 },
        symbolSize: 8,
        data: [{ value: [mi, sexLureData[mi]] }],
        itemStyle: { color: '#f59e0b', shadowBlur: 6, shadowColor: 'rgba(245,158,11,0.35)' },
        z: 99
      }
    ]
  }, { lazyUpdate: true })
}

function updateCompareCardPosition() {
  if (!compareChart) return
  const mi = compareMonthIndex.value
  const pixel = compareChart.convertToPixel('grid', [mi, sexLureData[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    compareCardPos.value = { x: pixel[0] + 14, y: pixel[1] - 16 }
  }
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const pestData = [120, 180, 250, 420, 580, 720, 850, 780, 600, 380, 220, 140]
const tempData = [8, 10, 15, 22, 28, 34, 38, 36, 30, 22, 14, 9]
const humidityData = [65, 60, 55, 50, 52, 58, 70, 75, 68, 62, 64, 66]
const rainfallData = [20, 25, 35, 45, 55, 80, 120, 95, 60, 40, 28, 18]

const sexLureData = [80, 120, 200, 350, 520, 780, 1050, 980, 720, 450, 260, 150]
const sprayData = [40, 70, 130, 240, 380, 550, 750, 680, 500, 310, 180, 100]

const warningImages: WarningImage[] = [
  { label: '监测点A', icon: '🐛', gradient: 'linear-gradient(145deg, rgba(245,158,11,0.28), rgba(217,119,6,0.16))' },
  { label: '监测点B', icon: '🪲', gradient: 'linear-gradient(145deg, rgba(239,68,68,0.25), rgba(220,38,38,0.14))' },
  { label: '监测点C', icon: '🦗', gradient: 'linear-gradient(145deg, rgba(168,85,247,0.25), rgba(147,51,234,0.14))' },
  { label: '监测点D', icon: '🐝', gradient: 'linear-gradient(145deg, rgba(6,182,212,0.25), rgba(8,145,178,0.14))' }
]

function initWeatherChart() {
  if (!weatherChartRef.value) return
  weatherChart = echarts.init(weatherChartRef.value)

  const option: echarts.EChartsOption = {
    grid: { top: 32, right: 52, bottom: 24, left: 42 },
    tooltip: { trigger: 'axis', confine: true },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(230,162,60,0.3)' } },
      axisLabel: { color: '#d4a574', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '',
        min: 0,
        max: 1000,
        splitLine: { lineStyle: { color: 'rgba(230,162,60,0.08)' } },
        axisLine: { show: false },
        axisLabel: { color: '#d4a574', fontSize: 9 }
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#d4a574', fontSize: 9 }
      }
    ],
    series: [
      {
        name: '虫害',
        type: 'line',
        data: pestData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 1,
        data: tempData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 3,
        lineStyle: { width: 1.5, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '湿度',
        type: 'line',
        yAxisIndex: 1,
        data: humidityData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 3,
        lineStyle: { width: 1.5, color: '#06b6d4' },
        itemStyle: { color: '#06b6d4' }
      },
      {
        name: '降雨',
        type: 'bar',
        yAxisIndex: 1,
        data: rainfallData,
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(156,163,175,0.5)' },
            { offset: 1, color: 'rgba(156,163,175,0.15)' }
          ])
        }
      }
    ]
  }

  weatherChart.setOption(option)

  // 启动月份轮播 timer
  refreshWeatherHighlight()
  weatherCardVisible.value = true
  nextTick(() => setTimeout(updateWeatherCardPosition, 200))
  weatherTimer = setInterval(advanceWeatherMonth, 2000)
}

function initCompareChart() {
  if (!compareChartRef.value) return
  compareChart = echarts.init(compareChartRef.value)

  const option: echarts.EChartsOption = {
    grid: { top: 32, right: 20, bottom: 24, left: 42 },
    tooltip: { trigger: 'axis', confine: true },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(230,162,60,0.3)' } },
      axisLabel: { color: '#d4a574', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1400,
      splitLine: { lineStyle: { color: 'rgba(230,162,60,0.08)' } },
      axisLine: { show: false },
      axisLabel: { color: '#d4a574', fontSize: 9 }
    },
    series: [
      {
        name: '性诱',
        type: 'line',
        data: sexLureData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#f59e0b' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245,158,11,0.18)' },
            { offset: 1, color: 'rgba(245,158,11,0.02)' }
          ])
        },
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: '灯诱',
        type: 'line',
        data: sprayData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#06b6d4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(6,182,212,0.16)' },
            { offset: 1, color: 'rgba(6,182,212,0.02)' }
          ])
        },
        itemStyle: { color: '#06b6d4' }
      }
    ]
  }

  compareChart.setOption(option)

  // 启动月份轮播 timer
  refreshCompareHighlight()
  compareCardVisible.value = true
  nextTick(() => setTimeout(updateCompareCardPosition, 200))
  compareTimer = setInterval(advanceCompareMonth, 2000)
}

function handleImageClick(img: WarningImage, index: number) {
  emit('image-click', img, index)
}

function handleResize() {
  weatherChart?.resize()
  compareChart?.resize()
}

onMounted(() => {
  initWeatherChart()
  initCompareChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (weatherTimer) { clearInterval(weatherTimer); weatherTimer = null }
  if (compareTimer) { clearInterval(compareTimer); compareTimer = null }
  weatherChart?.dispose()
  compareChart?.dispose()
})
</script>

<style scoped>
.pest-right-panel {
  width: 100%;
  height: 100%;
  background: linear-gradient(165deg, #2a1810 0%, #1f120a 50%, #1a0f08 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.pest-right-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 40px rgba(212, 136, 6, 0.04);
}

.panel-content {
  flex: 1;
  overflow: hidden;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== Panel Section ===== */
.panel-section {
  border-left: 2px solid #d48806;
  padding: 8px 10px 10px 12px;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.6), rgba(31, 18, 10, 0.4));
  border-radius: 0 8px 8px 0;
  position: relative;
}

/* ===== Section Title ===== */
.section-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 700;
  color: #e6a23c;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-shadow: 0 0 10px rgba(230, 162, 60, 0.25);
}

.title-icon {
  font-size: 14px;
}

.section-subtitle {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: #b8864a;
  font-weight: 500;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.section-header-row .section-title {
  margin-bottom: 0;
}

/* ===== Legend ===== */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.legend-item {
  font-size: 10px;
  color: #d4a574;
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-line {
  width: 14px;
  height: 2px;
  display: inline-block;
  border-radius: 1px;
}

.legend-bar {
  width: 10px;
  height: 8px;
  display: inline-block;
  border-radius: 2px;
}

/* ===== Chart Wrapper ===== */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: visible;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-tooltip {
  position: absolute;
  top: 16px;
  right: 12px;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.96), rgba(31, 18, 10, 0.94));
  border: 1px solid rgba(212, 136, 6, 0.35);
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 12px rgba(212, 136, 6, 0.08);
  backdrop-filter: blur(4px);
}

.tooltip-rate {
  font-size: 13px;
  font-weight: 800;
  color: #f59e0b;
  margin-bottom: 4px;
}

.tooltip-row {
  font-size: 10px;
  color: #d4a574;
  line-height: 1.6;
}

/* ===== 气象数据卡片 ===== */
.weather-data-card {
  position: absolute;
  z-index: 15;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.96), rgba(31, 18, 10, 0.94));
  border: 1px solid rgba(212, 136, 6, 0.35);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(212, 136, 6, 0.12);
  backdrop-filter: blur(5px);
  min-width: 110px;
  transition: left 0.45s cubic-bezier(.4,2,.2,1), top 0.45s cubic-bezier(.4,2,.2,1), opacity 0.25s ease;
}
.wdc-month {
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 5px;
  text-shadow: 0 0 8px rgba(251,191,36,0.3);
}
.wdc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.wdc-label {
  font-size: 9.5px;
  color: #b88a5a;
}
.wdc-val {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.wdc-pest { color: #f59e0b; }
.wdc-temp { color: #3b82f6; }
.wdc-humi { color: #06b6d4; }
.wdc-rain { color: #9ca3af; }

/* ===== 对比数据卡片 ===== */
.compare-data-card {
  position: absolute;
  z-index: 15;
  background: linear-gradient(135deg, rgba(42, 24, 16, 0.96), rgba(31, 18, 10, 0.94));
  border: 1px solid rgba(212, 136, 6, 0.35);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(212, 136, 6, 0.12);
  backdrop-filter: blur(5px);
  min-width: 100px;
  transition: left 0.45s cubic-bezier(.4,2,.2,1), top 0.45s cubic-bezier(.4,2,.2,1), opacity 0.25s ease;
}
.cdc-month {
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 5px;
  text-shadow: 0 0 8px rgba(251,191,36,0.3);
}
.cdc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.cdc-label { font-size: 9.5px; color: #b88a5a; }
.cdc-val { font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.cdc-sex { color: #f59e0b; }
.cdc-spray { color: #06b6d4; }

/* ===== Toggle Switch ===== */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-size: 10px;
  color: #b8864a;
  white-space: nowrap;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 30px;
  height: 16px;
  background: rgba(184, 134, 74, 0.2);
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid rgba(212, 136, 6, 0.25);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  background: #b8864a;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-input:checked + .toggle-switch {
  background: rgba(245, 158, 11, 0.35);
  border-color: rgba(245, 158, 11, 0.5);
}

.toggle-input:checked + .toggle-switch::after {
  left: 16px;
  background: #f59e0b;
}

/* ===== Region Tag ===== */
.region-tag {
  display: inline-block;
  font-size: 10px;
  color: #e6a23c;
  background: rgba(212, 136, 6, 0.12);
  border: 1px solid rgba(212, 136, 6, 0.25);
  padding: 2px 10px;
  border-radius: 10px;
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ===== Image Grid (2×2) ===== */
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.gallery-thumb {
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(212, 136, 6, 0.15);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(26, 15, 8, 0.6);
}

.gallery-thumb:hover {
  border-color: rgba(212, 136, 6, 0.45);
  transform: translateY(-2px) scale(1.03);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.35),
    0 0 14px rgba(212, 136, 6, 0.1);
}

.thumb-visual {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-icon {
  font-size: 22px;
  opacity: 0.75;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(212, 136, 6, 0.2), rgba(217, 119, 6, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.thumb-overlay span {
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(42, 24, 16, 0.85);
  border-radius: 14px;
  border: 1px solid rgba(212, 136, 6, 0.25);
}

.thumb-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3px 4px;
  font-size: 9px;
  color: #e6a23c;
  text-align: center;
  background: linear-gradient(to top, rgba(26, 15, 8, 0.92), transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
