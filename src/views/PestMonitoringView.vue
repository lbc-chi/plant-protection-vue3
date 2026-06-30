<template>
  <div class="pest-monitoring">
    <header class="pest-monitoring__header">
      <div class="header__left">
        <h1 class="header__title">虫害监测</h1>
        <p class="header__subtitle">全省农作物病虫害实时监测与预警</p>
      </div>
      <div class="header__right">
        <div class="quick-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalDetection }}</span>
            <span class="stat-label">本年检测总量</span>
          </div>
          <div class="stat-item stat--warning">
            <span class="stat-value">{{ peakMonth.value }}</span>
            <span class="stat-label">峰值月份</span>
          </div>
        </div>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载虫害监测数据..." />

    <div v-else-if="error" class="pest-monitoring__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="pest-monitoring__main">
      <section class="pest__stats-row">
        <StatCard
          v-for="stat in pestStats"
          :key="stat.label"
          :value="stat.value"
          :label="stat.label"
          :unit="stat.unit"
          :icon="stat.icon"
          :icon-bg="stat.iconBg"
          :trend="stat.trend"
          size="medium"
        />
      </section>

      <section class="pest__charts-top">
        <BaseCard title="主要害虫趋势" variant="shadow" class="chart-card chart-card--large">
          <template #extra>
            <div class="legend-tags">
              <span
                v-for="pest in pestNames"
                :key="pest"
                class="pest-tag"
              >{{ pest }}</span>
            </div>
          </template>
          <LineChart
            :x-axis-data="trendMonthsForPest"
            :series="pestTrendSeries"
            :smooth="true"
            height="340px"
          />
        </BaseCard>
      </section>

      <section class="pest__charts-middle">
        <BaseCard title="性诱监测曲线" variant="shadow" class="chart-card">
          <LineChart
            :x-axis-data="trendMonthsForPest"
            :series="sexTrapSeries"
            :smooth="true"
            :area-style="true"
            height="300px"
          />
        </BaseCard>

        <BaseCard title="历史年度对比" variant="shadow" class="chart-card">
          <LineChart
            :x-axis-data="trendMonths"
            :series="historyCompareSeries"
            :smooth="true"
            height="300px"
          />
        </BaseCard>
      </section>

      <section class="pest__bottom-grid">
        <BaseCard title="告警信息" variant="shadow" class="alert-card">
          <div class="alert-list">
            <div
              v-for="(alert, index) in alertList"
              :key="index"
              :class="['alert-item', `alert-item--${alert.level}`]"
            >
              <div class="alert-icon">{{ getAlertIcon(alert.level) }}</div>
              <div class="alert-content">
                <div class="alert-header">
                  <span class="alert-title">{{ alert.title }}</span>
                  <span :class="['alert-level', `level--${alert.level}`]">
                    {{ getLevelText(alert.level) }}
                  </span>
                </div>
                <p class="alert-desc">{{ alert.description }}</p>
                <div class="alert-meta">
                  <span>{{ alert.location }}</span>
                  <span>{{ alert.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="防治建议" variant="shadow" class="suggestion-card">
          <div class="suggestion-list">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-item"
            >
              <div class="suggestion-number">{{ String(index + 1).padStart(2, '0') }}</div>
              <div class="suggestion-content">
                <h4 class="suggestion-title">{{ suggestion.title }}</h4>
                <p class="suggestion-text">{{ suggestion.content }}</p>
                <div class="suggestion-meta">
                  <span class="meta-tag" :class="'tag--' + suggestion.priority">
                    {{ getPriorityText(suggestion.priority) }}
                  </span>
                  <span class="meta-target">目标：{{ suggestion.targetPest }}</span>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePestStore } from '@/store/usePestStore'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const pestStore = usePestStore()

const loading = ref(true)
const error = ref<string | null>(null)

const totalDetection = computed(() => pestStore.getters.totalAnnualDetection.value)
const peakMonth = computed(() => pestStore.getters.peakMonth.value)
const trendMonths = computed(() => pestStore.getters.trendMonths.value)
const trendMonthsForPest = computed(() => pestStore.getters.trendMonthsForPest.value)
const pestNames = computed(() => pestStore.getters.pestNames.value)

const pestStats = computed(() => [
  {
    value: totalDetection.value,
    label: '年检测总量',
    unit: '次',
    icon: '🔍',
    iconBg: '#3b82f6',
    trend: 15.2
  },
  {
    value: peakMonth.value.value,
    label: '月度峰值',
    unit: '次',
    icon: '📈',
    iconBg: '#ef4444',
    trend: -8.5
  },
  {
    value: pestNames.value.length,
    label: '监测虫种',
    unit: '种',
    icon: '🐛',
    iconBg: '#f59e0b',
    trend: 0
  },
  {
    value: 96.8,
    label: '预警准确率',
    unit: '%',
    icon: '🎯',
    iconBg: '#10b981',
    trend: 3.2
  }
])

const pestTrendSeries = computed(() =>
  pestNames.value.map(name => ({
    name,
    data: pestStore.getters.getPestData.value(name)
  }))
)

const sexTrapSeries = computed(() => [
  {
    name: '性诱捕获量',
    data: [280, 340, 450, 580, 720, 650, 520, 460, 400, 360, 320, 290]
  },
  {
    name: '诱芯有效率',
    data: [95, 92, 88, 85, 80, 75, 70, 72, 78, 85, 90, 94]
  }
])

const historyCompareSeries = computed(() => [
  {
    name: '2025年',
    data: pestStore.getters.currentYearData.value
  },
  {
    name: '2024年',
    data: pestStore.getters.previousYearData.value
  }
])

interface AlertItem {
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  location: string
  time: string
}

const alertList = computed<AlertItem[]>(() => [
  {
    level: 'critical',
    title: '粘虫高发预警',
    description: '临沂地区粘虫密度超过阈值，达到大发生级别，需立即采取防治措施',
    location: '临沂市 · 河东区',
    time: '10分钟前'
  },
  {
    level: 'warning',
    title: '玉米螟上升趋势',
    description: '潍坊地区玉米螟成虫数量连续3天上升，预计未来一周进入高峰期',
    location: '潍坊市 · 寒亭区',
    time: '30分钟前'
  },
  {
    level: 'warning',
    title: '蚜虫局部爆发',
    description: '济宁部分地块蚜虫密度偏高，建议加强监测并准备防治物资',
    location: '济宁市 · 任城区',
    time: '1小时前'
  },
  {
    level: 'info',
    title: '草地贪夜蛾监测',
    description: '南部边境地区草地贪夜蛾迁飞风险增加，已启动专项监测',
    location: '日照市 · 岚山区',
    time: '2小时前'
  }
])

interface Suggestion {
  priority: 'high' | 'medium' | 'low'
  title: string
  content: string
  targetPest: string
}

const suggestions = computed<Suggestion[]>(() => [
  {
    priority: 'high',
    title: '紧急化学防治',
    content: '对高密度区域喷施高效低毒杀虫剂，推荐使用甲维盐、氯虫苯甲酰胺等药剂，注意轮换用药避免抗药性产生。',
    targetPest: '粘虫'
  },
  {
    priority: 'high',
    title: '释放天敌生物',
    content: '在中等密度区域释放赤眼蜂、草蛉等天敌昆虫，每亩释放量8000-10000头，持续2-3次。',
    targetPest: '玉米螟'
  },
  {
    priority: 'medium',
    title: '安装诱捕设备',
    content: '在田块周边增设性诱剂诱捕器，每2-3亩设置一个，定期更换诱芯，监测成虫动态。',
    targetPest: '蚜虫'
  },
  {
    priority: 'low',
    title: '农业生态调控',
    content: '合理布局作物品种，推行间作套作模式，保护田间生物多样性，增强自然控害能力。',
    targetPest: '综合防治'
  }
])

function getAlertIcon(level: string): string {
  const icons: Record<string, string> = {
    critical: '🚨',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  }
  return icons[level] || 'ℹ️'
}

function getLevelText(level: string): string {
  const texts: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    error: '错误',
    info: '信息'
  }
  return texts[level] || level
}

function getPriorityText(priority: string): string {
  const texts: Record<string, string> = {
    high: '紧急',
    medium: '重要',
    low: '一般'
  }
  return texts[priority] || priority
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pest-monitoring {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.pest-monitoring__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  flex-wrap: wrap;
  gap: 16px;
}

.header__title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #2F6F9F, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px 0;
}

.header__subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.quick-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.stat--warning {
  border-color: rgba(239, 68, 68, 0.3);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2F6F9F;
}

.stat--warning .stat-value {
  color: #ef4444;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.pest-monitoring__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pest__stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.pest__charts-top {
  width: 100%;
}

.pest__charts-middle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.pest__bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-card,
.alert-card,
.suggestion-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.chart-card--large {
  width: 100%;
}

.chart-card :deep(.base-card__header),
.alert-card :deep(.base-card__header),
.suggestion-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.chart-card :deep(.base-card__title),
.alert-card :deep(.base-card__title),
.suggestion-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.legend-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pest-tag {
  padding: 4px 12px;
  font-size: 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: #93c5fd;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.alert-item:hover {
  background: rgba(15, 23, 42, 0.6);
  transform: translateX(4px);
}

.alert-item--critical { border-left-color: #ef4444; }
.alert-item--warning { border-left-color: #f59e0b; }
.alert-item--error { border-left-color: #f87171; }
.alert-item--info { border-left-color: #3b82f6; }

.alert-icon {
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 8px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.alert-level {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.level--critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.level--warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.level--error { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.level--info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.alert-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.alert-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(15, 23, 42, 0.6);
}

.suggestion-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 6px 0;
}

.suggestion-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.tag--high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.tag--medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.tag--low { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.meta-target {
  font-size: 11px;
  color: #64748b;
}

.pest-monitoring__error {
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
  .pest__charts-middle,
  .pest__bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .pest-monitoring__header,
  .pest-monitoring__main {
    padding: 16px;
  }

  .quick-stats {
    width: 100%;
    justify-content: center;
  }

  .pest__stats-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
