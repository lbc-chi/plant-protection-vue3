<template>
  <div class="pest-left-panel">
    <!-- Section 1: 年度数据采集（仪表盘+内联数据行） -->
    <section class="panel-box section-collection">
      <div class="panel-header">
        <h3 class="header-title">年度数据采集</h3>
      </div>
      <div class="collect-body">
        <div class="collect-gauge">
          <svg viewBox="0 0 120 120" class="gauge-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(212,165,116,.12)" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#d4a574" stroke-width="8"
              stroke-dasharray="280 327" stroke-linecap="round"
              transform="rotate(-90 60 60)" />
            <text x="60" y="54" text-anchor="middle" fill="#d4a574" font-size="22" font-weight="700">17</text>
            <text x="60" y="72" text-anchor="middle" fill="#64748b" font-size="10">万</text>
          </svg>
        </div>
        <div class="collect-stats">
          <div v-for="item in metricData" :key="item.label" class="collect-stat-row">
            <span class="stat-dot" :style="{ background: item.dotColor }"></span>
            <span class="stat-label">{{ item.label }}</span>
            <span class="stat-value">{{ item.value.toLocaleString() }}</span>
            <span class="stat-pct" :style="{ color: item.color }">{{ item.percent }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: 历史对比分析 -->
    <section class="panel-box section-history">
      <div class="panel-header">
        <button class="header-title-btn" @click="toggleExpand" title="点击放大查看">历史对比分析</button>
        <span class="header-subtitle">济南市 - 棉铃虫</span>
      </div>
      <div class="chart-legend-row">
        <span class="legend-item"><i class="legend-line" style="background:#2F6F9F"></i>2026</span>
        <span class="legend-item"><i class="legend-line" style="background:#f59e0b"></i>2025</span>
        <span class="legend-item"><i class="legend-line" style="background:#ef4444"></i>2024</span>
        <span class="legend-item"><i class="legend-line" style="background:#e2e8f0"></i>历年</span>
      </div>
      <div class="history-chart-wrap">
        <div class="history-canvas" ref="historyChartRef"></div>
        <!-- 当前月份悬浮数据卡片 -->
        <Transition name="data-card-fade">
          <div v-if="historyChartReady" class="history-data-card" :key="historyMonthIndex"
               :style="{ left: dataCardPosition.x + 'px', top: dataCardPosition.y + 'px' }">
            <div class="hdc-month">{{ seasonMonthLabels[historyMonthIndex] }}</div>
            <div class="hdc-row"><span class="hdc-label">2026:</span><span class="hdc-val hdc-cyan">{{ historyDataCard.y2026 }}</span></div>
            <div class="hdc-row"><span class="hdc-label">2025:</span><span class="hdc-val hdc-orange">{{ historyDataCard.y2025 }}</span></div>
            <div class="hdc-row"><span class="hdc-label">2024:</span><span class="hdc-val hdc-red">{{ historyDataCard.y2024 }}</span></div>
            <div class="hdc-row"><span class="hdc-label">历年:</span><span class="hdc-val hdc-white">{{ historyDataCard.yAvg }}</span></div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- 全屏弹窗：历史对比分析图放大 -->
    <Teleport to="body">
    <Transition name="expand-fade">
      <div v-if="isExpanded" class="expand-overlay" @click.self="toggleExpand">
        <div class="expand-dialog">
          <div class="expand-header">
            <h3 class="expand-title">历史对比分析</h3>
            <span class="expand-subtitle">济南市 - 棉铃虫</span>
            <button class="expand-close" @click="toggleExpand" title="关闭">✕</button>
          </div>
          <div class="expand-legend-row">
            <span class="legend-item"><i class="legend-line" style="background:#2F6F9F"></i>2026</span>
            <span class="legend-item"><i class="legend-line" style="background:#f59e0b"></i>2025</span>
            <span class="legend-item"><i class="legend-line" style="background:#ef4444"></i>2024</span>
            <span class="legend-item"><i class="legend-line" style="background:#e2e8f0"></i>历年</span>
          </div>
          <div class="expand-chart-wrap">
            <div ref="expandedChartRef" class="expanded-canvas"></div>
            <Transition name="data-card-fade">
              <div v-if="expandedChartReady" class="history-data-card expanded-card"
                   :style="{ left: expandedCardPos.x + 'px', top: expandedCardPos.y + 'px' }">
                <div class="hdc-month">{{ seasonMonthLabels[historyMonthIndex] }}</div>
                <div class="hdc-row"><span class="hdc-label">2026:</span><span class="hdc-val hdc-cyan">{{ historyDataCard.y2026 }}</span></div>
                <div class="hdc-row"><span class="hdc-label">2025:</span><span class="hdc-val hdc-orange">{{ historyDataCard.y2025 }}</span></div>
                <div class="hdc-row"><span class="hdc-label">2024:</span><span class="hdc-val hdc-red">{{ historyDataCard.y2024 }}</span></div>
                <div class="hdc-row"><span class="hdc-label">历年:</span><span class="hdc-val hdc-white">{{ historyDataCard.yAvg }}</span></div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>

    <!-- Section 3: 数据概览 -->
    <section class="panel-box section-overview">
      <div class="panel-header">
        <h3 class="header-title">数据概览</h3>
      </div>
      <div class="filter-row">
        <select v-model="filters.direction" class="filter-select">
          <option value="50">50公里</option>
          <option value="100">100公里</option>
          <option value="200" selected>200公里</option>
        </select>
        <select v-model="filters.deviceName" class="filter-select">
          <option value="" selected>设备名称</option>
          <option value="打喷">打喷</option>
          <option value="监测站">监测站</option>
          <option value="灯诱站">灯诱站</option>
        </select>
        <select v-model="filters.pestCount" class="filter-select">
          <option value="" selected>虫量数据</option>
          <option value="high">高(&gt;5000)</option>
          <option value="mid">中(2000-5000)</option>
          <option value="low">低(&lt;2000)</option>
        </select>
        <select v-model="filters.level" class="filter-select">
          <option value="" selected>发生等级</option>
          <option value="high">III级以上</option>
        </select>
      </div>
      <div class="table-scroll-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>距离(KM)</th>
            <th>设备名称</th>
            <th>虫量数据</th>
            <th>发生等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in overviewData" :key="idx">
            <td>{{ row.distance }}</td>
            <td>{{ row.deviceName }}</td>
            <td>{{ row.pestCount.toLocaleString() }}</td>
            <td><span class="level-tag" :class="'level-' + row.level">{{ row.levelText }}</span></td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from '@/utils/echarts'

const historyChartRef = ref<HTMLElement>()
let historyInstance: echarts.ECharts | null = null

const emit = defineEmits<{
  (e: 'month-change', monthIndex: number): void
}>()

// 历史对比分析图 - 月份轮播（跨年度虫害周期 7月~6月）
const historyMonthIndex = ref(0)
const historyChartReady = ref(false)
let historyTimer: ReturnType<typeof setInterval> | null = null

// 全屏展开状态
const isExpanded = ref(false)
const expandedChartRef = ref<HTMLDivElement>()
let expandedInstance: echarts.ECharts | null = null
const expandedChartReady = ref(false)
const expandedCardPos = ref({ x: 0, y: 0 })

// 数据卡片跟随折线图数据点位置
const dataCardPosition = ref({ x: 0, y: 0 })

const seasonMonthLabels = ['7月','8月','9月','10月','11月','12月','1月','2月','3月','4月','5月','6月']

// 四年数据（模拟棉铃虫跨年周期）
const histData2026 = [680,890,520,340,180,120,95,160,310,480,587,920]
const histData2025 = [420,720,890,640,380,210,140,190,360,510,279,680]
const histData2024 = [310,560,820,910,620,350,200,170,290,420,308,520]
const histDataAvg  = [880,920,750,520,320,200,150,220,340,490,338,600]

const historyDataCard = computed(() => {
  const mi = historyMonthIndex.value
  return {
    y2026: histData2026[mi],
    y2025: histData2025[mi],
    y2024: histData2024[mi],
    yAvg: histDataAvg[mi]
  }
})

function getHistoryChartOption(large = false) {
  const mi = historyMonthIndex.value
  const fontSize = large ? 13 : 10
  const labelFontSize = large ? 14 : 11

  return {
    backgroundColor: 'transparent',
    grid: { top: large ? 48 : 32, right: large ? 28 : 16, bottom: large ? 40 : 28, left: large ? 56 : 42 },
    xAxis: {
      type: 'category',
      data: seasonMonthLabels,
      axisLine: { lineStyle: { color: 'rgba(212,165,116,.18)' } },
      axisLabel: {
        color: (_idx: number) => (_idx === mi ? '#fbbf24' : '#a0826d'),
        fontSize: (_idx: number) => (_idx === mi ? labelFontSize : fontSize),
        interval: 0,
        fontWeight: (_idx: number) => (_idx === mi ? '700' : '400')
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1000,
      interval: 200,
      axisLine: { show: false },
      axisLabel: { color: '#a0826d', fontSize: large ? 12 : 10 },
      splitLine: { lineStyle: { color: 'rgba(212,165,116,.08)', type: 'dashed' } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(42,24,16,.95)',
      borderColor: 'rgba(212,136,6,.3)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: large ? 13 : 11 }
    },
    series: [
      {
        name: '2026',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: (idx: number) => (idx === mi ? (large ? 14 : 10) : (large ? 7 : 5)),
        data: histData2026.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#2F6F9F', borderColor: '#fff', borderWidth: 2 } : { color: '#2F6F9F' }
        })),
        lineStyle: { width: large ? 3 : 2.5, color: '#2F6F9F' },
        markLine: {
          silent: true,
          data: [{ xAxis: mi }],
          lineStyle: { color: 'rgba(251,191,36,.5)', width: 1.5, type: 'dashed' },
          symbol: 'none'
        },
        markPoint: {
          data: [{ coord: [mi, histData2026[mi]], symbol: 'circle', symbolSize: large ? 28 : 20, itemStyle: { color: 'rgba(47, 111, 159,.2)' } }],
          silent: true
        }
      },
      {
        name: '2025',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: (idx: number) => (idx === mi ? (large ? 12 : 9) : (large ? 7 : 5)),
        data: histData2025.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#f59e0b', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#f59e0b' }
        })),
        lineStyle: { width: large ? 3 : 2.5, color: '#f59e0b' }
      },
      {
        name: '2024',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: (idx: number) => (idx === mi ? (large ? 12 : 9) : (large ? 7 : 5)),
        data: histData2024.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#ef4444', borderColor: 'rgba(255,255,255,.6)', borderWidth: 2 } : { color: '#ef4444' }
        })),
        lineStyle: { width: large ? 3 : 2.5, color: '#ef4444' }
      },
      {
        name: '历年',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: (idx: number) => (idx === mi ? (large ? 12 : 9) : (large ? 6 : 4)),
        data: histDataAvg.map((v, idx) => ({
          value: v,
          itemStyle: idx === mi ? { color: '#e2e8f0', borderColor: 'rgba(255,255,255,.4)', borderWidth: 1 } : { color: '#e2e8f0' }
        })),
        lineStyle: { width: large ? 2.5 : 2, color: '#e2e8f0' }
      }
    ]
  }
}

function initHistoryChart() {
  if (!historyChartRef.value) return
  historyInstance = echarts.init(historyChartRef.value)
  historyInstance.setOption(getHistoryChartOption())
  historyChartReady.value = true
  nextTick(() => setTimeout(updateDataCardPosition, 100))
}

function refreshHistoryHighlight() {
  if (!historyInstance) return
  historyInstance.setOption(getHistoryChartOption(), true)
  nextTick(() => setTimeout(updateDataCardPosition, 50))
}

// 计算数据卡片位置（跟随当前月份数据点）
function updateDataCardPosition() {
  if (!historyInstance) return
  const mi = historyMonthIndex.value
  // 使用 convertToPixel 将数据坐标转换为像素坐标（以2026年数据点为基准）
  const pixel = historyInstance.convertToPixel('grid', [mi, histData2026[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    // 卡片定位在数据点右上方，带偏移避免遮挡
    dataCardPosition.value = { x: pixel[0] + 12, y: pixel[1] - 20 }
  }
}

function advanceHistoryMonth() {
  historyMonthIndex.value = (historyMonthIndex.value + 1) % 12
  refreshHistoryHighlight()
  // 如果处于全屏展开状态，同步刷新放大图表
  if (isExpanded.value && expandedInstance) {
    refreshExpandedHighlight()
  }
  emit('month-change', historyMonthIndex.value)
}

// ===== 全屏展开 =====
async function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    // 打开：等待 DOM 渲染后初始化放大图表
    await nextTick()
    setTimeout(() => {
      initExpandedChart()
    }, 100)
  } else {
    // 关闭：销毁放大图表
    if (expandedInstance) { expandedInstance.dispose(); expandedInstance = null }
    expandedChartReady.value = false
  }
}

function initExpandedChart() {
  if (!expandedChartRef.value) return
  expandedInstance = echarts.init(expandedChartRef.value)
  expandedInstance.setOption(getHistoryChartOption(true))
  expandedChartReady.value = true
  nextTick(() => setTimeout(updateExpandedCardPosition, 150))
}

function refreshExpandedHighlight() {
  if (!expandedInstance) return
  expandedInstance.setOption(getHistoryChartOption(true), true)
  nextTick(() => setTimeout(updateExpandedCardPosition, 50))
}

function updateExpandedCardPosition() {
  if (!expandedInstance) return
  const mi = historyMonthIndex.value
  const pixel = expandedInstance.convertToPixel('grid', [mi, histData2026[mi]])
  if (pixel && Array.isArray(pixel) && pixel.length === 2) {
    expandedCardPos.value = { x: pixel[0] + 18, y: pixel[1] - 24 }
  }
}

const metricData = [
  { label: '性诱数据', value: 3200, percent: 30, color: '#10b981', dotColor: '#10b981' },
  { label: '灯诱数据', value: 1800, percent: 20, color: '#f59e0b', dotColor: '#f59e0b' },
  { label: '人工监测', value: 1600, percent: 25, color: '#3b82f6', dotColor: '#3b82f6' },
  { label: '图像监查', value: 2400, percent: 25, color: '#2F6F9F', dotColor: '#2F6F9F' }
]

function handleResize() {
  historyInstance?.resize()
}

onMounted(() => {
  setTimeout(() => initHistoryChart(), 150)
  window.addEventListener('resize', handleResize)
  // 启动历史对比分析图月份轮播 timer
  historyTimer = setInterval(advanceHistoryMonth, 2000)
})

onUnmounted(() => {
  if (historyTimer) { clearInterval(historyTimer); historyTimer = null }
  window.removeEventListener('resize', handleResize)
  historyInstance?.dispose()
  if (expandedInstance) { expandedInstance.dispose(); expandedInstance = null }
})

const filters = reactive({
  direction: '200',
  deviceName: '',
  pestCount: '',
  level: ''
})

interface OverviewRow {
  distance: number
  deviceName: string
  pestCount: number
  level: string
  levelText: string
}

// 完整数据源（模拟不同距离、设备、虫量、等级的监测记录）
const allOverviewData: OverviewRow[] = [
  { distance: 12, deviceName: '历下区Y村打喷',   pestCount: 1850, level: 'low',     levelText: 'I级' },
  { distance: 18, deviceName: '历下区X村灯诱站', pestCount: 3620, level: 'mid',     levelText: 'II级' },
  { distance: 28, deviceName: '历下区Y村打喷',   pestCount: 5890, level: 'high',    levelText: 'III级' },
  { distance: 30, deviceName: '市中区Z村监测站', pestCount: 8410, level: 'critical',levelText: 'IV级' },
  { distance: 35, deviceName: '槐荫区A点打喷',   pestCount: 12300,level: 'severe',  levelText: 'V级' },
  { distance: 45, deviceName: '天桥区B村灯诱站', pestCount: 4150, level: 'mid',     levelText: 'II级' },
  { distance: 58, deviceName: '历城区C村打喷',   pestCount: 2380, level: 'low',     levelText: 'I级' },
  { distance: 72, deviceName: '长清区D村监测站', pestCount: 9670, level: 'critical',levelText: 'IV级' },
  { distance: 88, deviceName: '章丘区E村打喷',   pestCount: 1690, level: 'low',     levelText: 'I级' },
  { distance: 102,deviceName: '济阳区F村灯诱站', pestCount: 6230, level: 'high',    levelText: 'III级' },
  { distance: 120,deviceName: '莱芜区G村打喷',   pestCount: 4870, level: 'mid',     levelText: 'II级' },
  { distance: 138,deviceName: '钢城区H村监测站', pestCount: 1120, level: 'low',     levelText: 'I级' },
  { distance: 155,deviceName: '平阴县I村打喷',   pestCount: 10500,level: 'severe',  levelText: 'V级' },
  { distance: 175,deviceName: '商河县J村灯诱站', pestCount: 7350, level: 'high',    levelText: 'III级' }
]

// 根据筛选条件过滤显示的数据
const overviewData = computed(() => {
  let result = [...allOverviewData]

  // 距离筛选：只显示 <= 选中距离的数据
  const maxDist = Number(filters.direction) || 200
  result = result.filter(row => row.distance <= maxDist)

  // 设备名称筛选
  if (filters.deviceName) {
    const keyword = filters.deviceName
    result = result.filter(row => row.deviceName.includes(keyword))
  }

  // 虫量数据筛选
  if (filters.pestCount === 'high') {
    result = result.filter(row => row.pestCount > 5000)
  } else if (filters.pestCount === 'mid') {
    result = result.filter(row => row.pestCount >= 2000 && row.pestCount <= 5000)
  } else if (filters.pestCount === 'low') {
    result = result.filter(row => row.pestCount < 2000)
  }

  // 发生等级筛选
  if (filters.level === 'high') {
    result = result.filter(row => ['high','critical','severe'].includes(row.level))
  }

  return result
})

defineExpose({
  refreshCharts: () => initHistoryChart(),
  historyMonthIndex
})
</script>

<style scoped>
.pest-left-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;
}
.pest-left-panel::-webkit-scrollbar { width: 3px; }
.pest-left-panel::-webkit-scrollbar-thumb { background: rgba(212,165,116,.12); border-radius: 2px; }

.panel-box {
  background: linear-gradient(145deg, rgba(42, 24, 16, .95), rgba(32, 18, 12, .92));
  border: 1px solid rgba(212, 136, 6, .14);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.panel-box::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1.5px;
  background: linear-gradient(90deg, transparent 8%, rgba(212,136,6,.4) 50%, transparent 92%);
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 14px;
  background: linear-gradient(90deg, rgba(212,136,6,.06), transparent 70%);
  border-bottom: 1px solid rgba(212,136,6,.08);
}
.header-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #d4a574;
  letter-spacing: 2px;
}
/* 历史对比分析标题 - 可点击展开 */
.header-title-btn {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  font-weight: 800;
  color: #d4a574;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color .2s ease, text-shadow .2s ease;
}
.header-title-btn:hover {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251,191,36,.3);
}
.header-subtitle {
  font-size: 11px;
  color: #a0826d;
  font-weight: 500;
}

/* ===== Section 1: 走廊数据采集量（时钟左置+内联）===== */
.section-collection { flex-shrink: 0; }

.collect-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 14px 10px;
}
.collect-gauge {
  flex-shrink: 0;
}
.gauge-svg {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 12px rgba(212,165,116,.2));
}
.collect-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.collect-stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.stat-label {
  font-size: 11.5px;
  color: #a0826d;
  font-weight: 500;
  white-space: nowrap;
}
.stat-value {
  font-size: 13px;
  font-weight: 800;
  color: #e2e8f0;
  min-width: 48px;
  text-align: right;
  font-family: 'Courier New', monospace;
}
.stat-pct {
  font-size: 12px;
  font-weight: 700;
  min-width: 34px;
}

/* ===== Section 2: 历史对比分析 ===== */
.section-history {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  overflow: hidden;
}
.chart-legend-row {
  display: flex;
  gap: 14px;
  padding: 6px 14px 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: #a0826d;
  font-weight: 600;
}
.legend-line {
  width: 18px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}
.history-chart-wrap {
  flex: 1;
  min-height: 160px;
  width: 100%;
  padding: 0 6px 8px;
  position: relative;
}
.history-canvas {
  width: 100%;
  height: 100%;
}

/* ===== 历史对比数据卡片 ===== */
.history-data-card {
  position: absolute;
  z-index: 10;
  background: linear-gradient(145deg, rgba(42,24,16,.92), rgba(30,16,10,.88));
  border: 1px solid rgba(212,136,6,.25);
  border-radius: 6px;
  padding: 8px 12px;
  min-width: 110px;
  box-shadow: 0 4px 20px rgba(0,0,0,.4), 0 0 12px rgba(212,136,6,.08);
  transition: left 0.5s cubic-bezier(.4,2,.2,1), top 0.5s cubic-bezier(.4,2,.2,1), opacity 0.25s ease;
}
.hdc-month {
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 6px;
  letter-spacing: 1px;
}
.hdc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 0;
}
.hdc-label {
  font-size: 11px;
  color: #a0826d;
  font-weight: 500;
}
.hdc-val {
  font-size: 14px;
  font-weight: 800;
  font-family: 'Courier New', monospace;
}
.hdc-cyan { color: #2F6F9F; text-shadow: 0 0 8px rgba(47, 111, 159,.3); }
.hdc-orange { color: #f59e0b; text-shadow: 0 0 8px rgba(245,158,11,.3); }
.hdc-red { color: #ef4444; text-shadow: 0 0 8px rgba(239,68,68,.3); }
.hdc-white { color: #e2e8f0; text-shadow: 0 0 8px rgba(226,232,240,.2); }

.data-card-fade-enter-active,
.data-card-fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.data-card-fade-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(.96);
}
.data-card-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(.98);
}

/* ===== Section 3: 数据概览 ===== */
.section-overview {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.filter-row {
  display: flex;
  gap: 4px;
  padding: 6px 14px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.filter-select {
  flex: 1;
  min-width: 0;
  background: rgba(42,20,12,.65);
  border: 1px solid rgba(212,136,6,.12);
  border-radius: 3px;
  color: #a0826d;
  font-size: 10px;
  padding: 3px 6px;
  outline: none;
  cursor: pointer;
}
.filter-select option {
  background: #2a1810;
  color: #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}
.table-scroll-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 4px 4px;
}
.table-scroll-wrap::-webkit-scrollbar { width: 3px; }
.table-scroll-wrap::-webkit-scrollbar-thumb { background: rgba(212,165,116,.12); border-radius: 2px; }
.data-table thead th {
  padding: 4px 4px;
  text-align: left;
  color: #d4a574;
  font-weight: 600;
  font-size: 9.5px;
  border-bottom: 1px solid rgba(212,136,6,.15);
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: linear-gradient(145deg, rgba(42,24,16,.98), rgba(32,18,12,.95));
  z-index: 1;
}
.data-table tbody td {
  padding: 3px 4px;
  color: #b89a7a;
  border-bottom: 1px solid rgba(212,136,6,.04);
  white-space: nowrap;
}

.level-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
}
.level-low     { color: #4ade80; background: rgba(22,101,52,.3);   border: 1px solid rgba(74,222,128,.2); }
.level-mid     { color: #fb923c; background: rgba(180,83,9,.3);    border: 1px solid rgba(251,146,60,.2); }
.level-high    { color: #f87171; background: rgba(153,27,27,.3);   border: 1px solid rgba(248,113,113,.2); }
.level-critical{ color: #ef4444; background: rgba(127,29,29,.4);    border: 1px solid rgba(239,68,68,.3); }
.level-severe  { color: #fecaca; background: rgba(80,10,10,.45);   border: 1px solid rgba(254,202,202,.3); }

/* ===== 全屏展开弹窗 ===== */
.expand-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(6, 4, 2, .88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.expand-dialog {
  width: 82vw;
  max-width: 1100px;
  height: 76vh;
  max-height: 720px;
  background: linear-gradient(165deg, #2a1810, #1f120a 50%, #1a0f08);
  border: 1px solid rgba(212,136,6,.25);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(212,136,6,.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.expand-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(212,136,6,.12);
  flex-shrink: 0;
}
.expand-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #e6a23c;
  letter-spacing: 3px;
}
.expand-subtitle {
  font-size: 13px;
  color: #b8864a;
}
.expand-close {
  margin-left: auto;
  background: rgba(212,136,6,.15);
  border: 1px solid rgba(212,136,6,.3);
  color: #d4a574;
  font-size: 15px;
  width: 30px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s ease;
}
.expand-close:hover {
  background: rgba(220,100,40,.35);
  color: #fff;
  border-color: rgba(240,120,60,.5);
}
.expand-legend-row {
  display: flex;
  gap: 16px;
  padding: 8px 20px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.expand-legend-row .legend-item { font-size: 12px; }
.expand-legend-row .legend-line { width: 20px; height: 2.5px; }
.expand-chart-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: visible;
  padding: 8px 16px 12px;
}
.expanded-canvas {
  width: 100%;
  height: 100%;
}
.expanded-card {
  transform: scale(1.15);
}
.expanded-card .hdc-month { font-size: 17px; }
.expanded-card .hdc-label { font-size: 13px; }
.expanded-card .hdc-val { font-size: 15px; }

/* 展开动画 */
.expand-fade-enter-active { transition: opacity .3s ease; }
.expand-fade-leave-active { transition: opacity .25s ease; }
.expand-fade-enter-from,
.expand-fade-leave-to { opacity: 0; }
</style>
