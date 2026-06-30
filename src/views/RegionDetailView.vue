<template>
  <div class="region-detail">
    <header class="region-detail__header">
      <div class="header__left">
        <button class="back-btn" @click="$router.back()">
          ← 返回
        </button>
        <div class="region-title-group">
          <span class="region-icon">🏙️</span>
          <div>
            <h1 class="region-name">{{ cityName }}</h1>
            <p class="region-subtitle">{{ regionInfo.subtitle }}</p>
          </div>
        </div>
      </div>
      <div class="header__right">
        <span :class="['risk-badge', `risk-badge--${riskLevel}`]">
          风险等级：{{ riskLevelText }}
        </span>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载地区数据..." />

    <div v-else-if="error" class="region-detail__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="region-detail__main">
      <section class="region__info-card">
        <BaseCard title="地区基本信息" variant="shadow" class="info-card info-card--full">
          <div class="info-grid">
            <div
              v-for="(item, index) in regionBasicInfo"
              :key="index"
              class="info-tile"
            >
              <span class="tile-icon">{{ item.icon }}</span>
              <div class="tile-content">
                <span class="tile-label">{{ item.label }}</span>
                <span class="tile-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section class="region__area-stats">
        <BaseCard title="发生面积 / 防治面积统计" variant="shadow" class="chart-card chart-card--full">
          <div class="area-stats-grid">
            <StatCard
              value={occurrenceArea}
              label="累计发生面积"
              unit="万亩"
              icon="⚠️"
              icon-bg="#ef4444"
              size="large"
            />
            <StatCard
              value={preventionArea}
              label="防治面积"
              unit="万亩"
              icon="🛡️"
              icon-bg="#10b981"
              size="large"
            />
            <StatCard
              value={preventionRate}
              label="防治率"
              unit="%"
              icon="📊"
              icon-bg="#3b82f6"
              :trend="5.2"
              size="large"
            />
            <StatCard
              value={hazardRate}
              label="危害率"
              unit="%"
              icon="🔴"
              icon-bg="#f59e0b"
              :trend="-2.8"
              size="large"
            />
          </div>
          <div class="area-compare-chart">
            <BarChart
              :x-axis-data="areaMonths"
              :series="areaCompareSeries"
              height="280px"
            />
          </div>
        </BaseCard>
      </section>

      <section class="region__grid-middle">
        <BaseCard title="监测点分布" variant="shadow" class="monitor-card">
          <div class="monitor-point-list">
            <div
              v-for="(point, index) in monitoringPoints"
              :key="index"
              class="monitor-point-item"
            >
              <div class="point-header">
                <span class="point-name">{{ point.name }}</span>
                <span :class="['point-status', `status--${getPointStatus(point)}`]">
                  {{ getPointStatusText(point) }}
                </span>
              </div>
              <div class="point-details">
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span>覆盖面积: {{ point.area }} 亩</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📡</span>
                  <span>设备数量: {{ point.devices }} 台</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🌍</span>
                  <span>坐标: {{ point.longitude.toFixed(2) }}, {{ point.latitude.toFixed(2) }}</span>
                </div>
              </div>
              <div class="point-bar">
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: `${(point.devices / 15) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="危害率分析" variant="shadow" class="hazard-card">
          <RadarChart
            :indicators="hazardIndicators"
            :series="hazardSeries"
            height="320px"
          />
          <div class="hazard-summary">
            <div
              v-for="(item, index) in hazardSummary"
              :key="index"
              class="hazard-item"
            >
              <span class="hazard-pest">{{ item.pest }}</span>
              <div class="hazard-bar-wrapper">
                <div class="hazard-bar-track">
                  <div
                    class="hazard-bar-fill"
                    :style="{ width: item.rate + '%' }"
                    :class="'hazard--' + item.level"
                  ></div>
                </div>
                <span class="hazard-rate">{{ item.rate }}%</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section class="region__trend-section">
        <BaseCard title="本地化虫情趋势" variant="shadow" class="trend-card trend-card--full">
          <template #extra>
            <div class="trend-controls">
              <button
                v-for="pest in localPests"
                :key="pest"
                :class="['pest-tab', { 'pest-tab--active': selectedPest === pest }]"
                @click="selectedPest = pest"
              >{{ pest }}</button>
            </div>
          </template>
          <LineChart
            :x-axis-data="localTrendMonths"
            :series="localTrendSeries"
            :smooth="true"
            :area-style="true"
            height="340px"
          />
          <div class="trend-insights">
            <div
              v-for="(insight, index) in trendInsights"
              :key="index"
              class="insight-card"
            >
              <span class="insight-icon">{{ insight.icon }}</span>
              <div class="insight-content">
                <span class="insight-label">{{ insight.label }}</span>
                <span class="insight-value">{{ insight.value }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section class="region__main-pests">
        <BaseCard title="主要虫害种类" variant="shadow" class="pests-card pests-card--full">
          <div class="pests-grid">
            <div
              v-for="(pest, index) in mainPests"
              :key="index"
              class="pest-card-item"
            >
              <div class="pest-header">
                <span class="pest-icon">{{ pest.icon }}</span>
                <span class="pest-name">{{ pest.name }}</span>
              </div>
              <div class="pest-stats">
                <div class="pest-stat">
                  <span class="stat-num">{{ pest.density }}</span>
                  <span class="stat-unit">头/百株</span>
                </div>
                <div class="pest-level" :class="'level-' + pest.level">
                  {{ getPestLevelText(pest.level) }}
                </div>
              </div>
              <div class="pest-trend">
                <span :class="['trend-indicator', pest.trend > 0 ? 'trend-up' : 'trend-down']">
                  {{ pest.trend > 0 ? '↑' : '↓' }} {{ Math.abs(pest.trend) }}%
                </span>
                <span class="trend-period">较上周</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePestStore } from '@/store/usePestStore'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const pestStore = usePestStore()

const loading = ref(true)
const error = ref<string | null>(null)
const selectedPest = ref('粘虫')

const regionId = computed(() => route.params.id as string)
const cityName = computed(() => pestStore.getters.linyiCityName.value || '临沂市')
const occurrenceArea = computed(() => pestStore.getters.occurrenceArea.value || 128.5)
const preventionArea = computed(() => pestStore.getters.preventionArea.value || 115.2)
const preventionRate = computed(() => pestStore.getters.preventionRate.value || 89.6)
const hazardRate = computed(() => pestStore.getters.hazardRate.value || 12.3)
const monitoringPoints = computed(() => pestStore.getters.monitoringPoints.value || [])
const mainPestsList = computed(() => pestStore.getters.mainPests.value || [])

const riskLevel = computed(() => {
  if (hazardRate.value > 20) return 'high'
  if (hazardRate.value > 10) return 'medium'
  return 'low'
})

const riskLevelText = computed(() => {
  const texts: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' }
  return texts[riskLevel.value] || '未知'
})

const regionInfo = computed(() => ({
  subtitle: '山东省南部 · 辖3区9县 · 农业大市'
}))

const regionBasicInfo = computed(() => [
  { icon: '👥', label: '常住人口', value: '1,101万人' },
  { icon: '🌾', label: '耕地面积', value: '963万亩' },
  { icon: '🏭', label: '农业产值', value: '685亿元' },
  { icon: '📡', label: '监测设备', value: `${pestStore.getters.totalMonitoringDevices.value}台` },
  { icon: '📍', label: '监测站点', value: `${monitoringPoints.value.length}个` },
  { icon: '🐛', label: '主要害虫', value: `${mainPestsList.value.length}种` }
])

const areaMonths = computed(() => ['1月', '2月', '3月', '4月', '5月', '6月'])

const areaCompareSeries = computed(() => [
  {
    name: '发生面积(万亩)',
    data: [8.5, 12.3, 18.6, 28.4, 35.2, 25.8]
  },
  {
    name: '防治面积(万亩)',
    data: [7.2, 11.0, 16.8, 26.0, 32.5, 24.0]
  }
])

const hazardIndicators = computed(() => [
  { name: '小麦', max: 50 },
  { name: '玉米', max: 50 },
  { name: '花生', max: 50 },
  { name: '蔬菜', max: 50 },
  { name: '果树', max: 50 },
  { name: '大豆', max: 50 }
])

const hazardSeries = computed(() => [
  {
    name: '危害率(%)',
    value: [18, 22, 15, 28, 12, 10]
  },
  {
    name: '去年同比',
    value: [22, 25, 18, 32, 14, 13]
  }
])

const hazardSummary = computed(() => [
  { pest: '粘虫', rate: 22, level: 'high' },
  { pest: '玉米螟', rate: 18, level: 'medium' },
  { pest: '蚜虫', rate: 15, level: 'medium' },
  { pest: '草地贪夜蛾', rate: 8, level: 'low' },
  { pest: '红蜘蛛', rate: 12, level: 'medium' }
])

const localPests = computed(() => ['粘虫', '玉米螟', '蚜虫', '草地贪夜蛾'])
const localTrendMonths = computed(() => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])

const localTrendSeries = computed(() => [
  {
    name: `${selectedPest.value}密度`,
    data: generatePestData(selectedPest.value)
  },
  {
    name: '去年同期',
    data: generatePestData(selectedPest.value, true)
  }
])

function generatePestData(pest: string, isLastYear = false): number[] {
  const baseData: Record<string, number[]> = {
    '粘虫': [5, 8, 15, 28, 45, 65, 52, 38, 25, 15, 8, 4],
    '玉米螟': [2, 4, 8, 18, 32, 48, 42, 30, 18, 10, 5, 2],
    '蚜虫': [8, 12, 20, 35, 55, 72, 58, 42, 28, 16, 10, 6],
    '草地贪夜蛾': [0, 0, 2, 5, 12, 22, 28, 20, 10, 4, 1, 0]
  }

  const data = baseData[pest] || Array(12).fill(0)

  if (isLastYear) {
    return data.map(v => Math.round(v * 0.85 + Math.random() * 5))
  }

  return data.map(v => Math.round(v * (1 + (Math.random() - 0.5) * 0.2)))
}

const trendInsights = computed(() => [
  { icon: '📈', label: '月度峰值', value: `${peakMonthValue} 头/百株` },
  { icon: '📅', label: '高峰月份', value: peakMonthName.value },
  { icon: '🔄', label: '环比变化', value: '+8.5%' },
  { icon: '🎯', label: '预警状态', value: '需关注' }
])

const peakMonthValue = computed(() => {
  const data = generatePestData(selectedPest.value)
  return Math.max(...data)
})

const peakMonthName = computed(() => {
  const data = generatePestData(selectedPest.value)
  const maxVal = Math.max(...data)
  const monthIndex = data.indexOf(maxVal)
  return localTrendMonths.value[monthIndex] || '-'
})

interface MainPestItem {
  icon: string
  name: string
  density: number
  level: 'high' | 'medium' | 'low'
  trend: number
}

const mainPests = computed<MainPestItem[]>(() => [
  { icon: '🐛', name: '粘虫', density: 45, level: 'high', trend: 12.5 },
  { icon: '🦗', name: '玉米螟', density: 32, level: 'medium', trend: 8.2 },
  { icon: '🐜', name: '蚜虫', density: 58, level: 'high', trend: -5.3 },
  { icon: '🦋', name: '草地贪夜蛾', density: 15, level: 'medium', trend: 22.8 },
  { icon: '🕷️', name: '红蜘蛛', density: 22, level: 'low', trend: 3.6 },
  { icon: '🪲', name: '地下害虫', density: 8, level: 'low', trend: -2.1 }
])

function getPointStatus(point: { devices: number; area: number }): string {
  const ratio = point.devices / (point.area / 1000)
  if (ratio >= 3) return 'good'
  if (ratio >= 1.5) return 'normal'
  return 'weak'
}

function getPointStatusText(point: { devices: number; area: number }): string {
  const status = getPointStatus(point)
  const texts: Record<string, string> = { good: '覆盖良好', normal: '基本达标', weak: '需加强' }
  return texts[status] || '未知'
}

function getPestLevelText(level: string): string {
  const texts: Record<string, string> = { high: '高发', medium: '中等', low: '低发' }
  return texts[level] || level
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await pestStore.actions.fetchPestData()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function retry() {
  fetchData()
}

watch(regionId, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.region-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.region-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  flex-wrap: wrap;
  gap: 16px;
}

.header__left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  padding: 8px 18px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #2F6F9F;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(59, 130, 246, 0.25);
  transform: translateX(-4px);
}

.region-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.region-icon {
  font-size: 40px;
}

.region-name {
  font-size: 26px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 4px 0;
}

.region-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.risk-badge {
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.risk-badge--high {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.risk-badge--medium {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.risk-badge--low {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.region-detail__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.chart-card,
.monitor-card,
.hazard-card,
.trend-card,
.pests-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.info-card--full,
.chart-card--full,
.trend-card--full,
.pests-card--full {
  width: 100%;
}

.info-card :deep(.base-card__header),
.chart-card :deep(.base-card__header),
.monitor-card :deep(.base-card__header),
.hazard-card :deep(.base-card__header),
.trend-card :deep(.base-card__header),
.pests-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.info-card :deep(.base-card__title),
.chart-card :deep(.base-card__title),
.monitor-card :deep(.base-card__title),
.hazard-card :deep(.base-card__title),
.trend-card :deep(.base-card__title),
.pests-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.info-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.info-tile:hover {
  border-color: rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.tile-icon {
  font-size: 28px;
}

.tile-content {
  display: flex;
  flex-direction: column;
}

.tile-label {
  font-size: 12px;
  color: #64748b;
}

.tile-value {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.area-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.area-compare-chart {
  padding-top: 8px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.region__grid-middle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.monitor-point-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.monitor-point-item {
  padding: 14px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.08);
  transition: all 0.3s ease;
}

.monitor-point-item:hover {
  border-color: rgba(59, 130, 246, 0.2);
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.point-name {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.point-status {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.status--good { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.status--normal { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.status--weak { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.point-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.detail-icon {
  font-size: 14px;
}

.point-bar {
  margin-top: 8px;
}

.bar-track {
  height: 4px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #7c3aed);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.hazard-summary {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.hazard-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hazard-pest {
  font-size: 13px;
  color: #cbd5e1;
  min-width: 80px;
}

.hazard-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hazard-bar-track {
  flex: 1;
  height: 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.hazard-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.hazard--high { background: linear-gradient(90deg, #ef4444, #f87171); }
.hazard--medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.hazard--low { background: linear-gradient(90deg, #10b981, #34d399); }

.hazard-rate {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  min-width: 36px;
  text-align: right;
}

.trend-controls {
  display: flex;
  gap: 6px;
}

.pest-tab {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pest-tab:hover {
  border-color: rgba(59, 130, 246, 0.4);
  color: #cbd5e1;
}

.pest-tab--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.2));
  border-color: #3b82f6;
  color: #2F6F9F;
}

.trend-insights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.insight-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
}

.insight-icon {
  font-size: 22px;
}

.insight-content {
  display: flex;
  flex-direction: column;
}

.insight-label {
  font-size: 11px;
  color: #64748b;
}

.insight-value {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.pests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.pest-card-item {
  padding: 18px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.pest-card-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-3px);
}

.pest-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.pest-icon {
  font-size: 26px;
}

.pest-name {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.pest-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #2F6F9F;
}

.stat-unit {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.pest-level {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.level-high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.level-medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.level-low { background: rgba(16, 185, 129, 0.15); color: #10b981; }

.pest-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.trend-indicator {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.trend-up { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.trend-down { color: #10b981; background: rgba(16, 185, 129, 0.1); }

.trend-period {
  color: #64748b;
}

.region-detail__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: #f87171;
}

.retry-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

@media (max-width: 1200px) {
  .region__grid-middle {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .region-detail__header,
  .region-detail__main {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .area-stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .pests-grid {
    grid-template-columns: 1fr;
  }

  .trend-insights {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
