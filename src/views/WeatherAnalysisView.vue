<template>
  <div class="weather-analysis">
    <header class="weather-analysis__header">
      <div class="header__left">
        <h1 class="header__title">气象分析</h1>
        <p class="header__subtitle">全省农业气象数据监测与预警分析</p>
      </div>
      <div class="header__right">
        <div class="current-weather">
          <span class="weather-icon">🌤️</span>
          <div class="weather-info">
            <span class="temp">26°C</span>
            <span class="condition">多云转晴</span>
          </div>
        </div>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载气象数据..." />

    <div v-else-if="error" class="weather-analysis__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="weather-analysis__main">
      <section class="weather__stats-row">
        <StatCard
          v-for="stat in weatherStats"
          :key="stat.label"
          :value="stat.value"
          :label="stat.label"
          :unit="stat.unit"
          :icon="stat.icon"
          :icon-bg="stat.iconBg"
          size="medium"
        />
      </section>

      <section class="weather__charts-top">
        <BaseCard title="温湿度变化曲线" variant="shadow" class="chart-card chart-card--large">
          <LineChart
            :x-axis-data="tempMonths"
            :series="tempHumiditySeries"
            :smooth="true"
            height="340px"
          />
        </BaseCard>
      </section>

      <section class="weather__charts-middle">
        <BaseCard title="月度降雨量分布" variant="shadow" class="chart-card">
          <BarChart
            :x-axis-data="rainfallMonths"
            :series="rainfallSeries"
            height="300px"
          />
        </BaseCard>

        <BaseCard title="季节性气候分析" variant="shadow" class="chart-card">
          <RadarChart
            :indicators="seasonalIndicators"
            :series="seasonalSeries"
            height="320px"
          />
        </BaseCard>
      </section>

      <section class="weather__alerts-section">
        <BaseCard title="气象预警信息" variant="shadow" class="alert-card">
          <div class="alert-list">
            <div
              v-for="(alert, index) in weatherAlerts"
              :key="index"
              :class="['weather-alert', `weather-alert--${alert.level}`]"
            >
              <div class="alert-icon">{{ alert.icon }}</div>
              <div class="alert-body">
                <div class="alert-header">
                  <span class="alert-type">{{ alert.type }}</span>
                  <span :class="['alert-level-badge', `badge--${alert.level}`]">
                    {{ alert.levelText }}
                  </span>
                </div>
                <p class="alert-message">{{ alert.message }}</p>
                <div class="alert-footer">
                  <span class="alert-region">{{ alert.region }}</span>
                  <span class="alert-time">{{ alert.time }}</span>
                  <span class="alert-duration">持续 {{ alert.duration }}</span>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="农事气象建议" variant="shadow" class="advice-card">
          <div class="advice-list">
            <div
              v-for="(advice, index) in farmingAdvice"
              :key="index"
              class="advice-item"
            >
              <div class="advice-icon">{{ advice.icon }}</div>
              <div class="advice-content">
                <h4 class="advice-title">{{ advice.title }}</h4>
                <p class="advice-text">{{ advice.text }}</p>
                <div class="advice-tags">
                  <span
                    v-for="(tag, i) in advice.tags"
                    :key="i"
                    class="advice-tag"
                  >{{ tag }}</span>
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
import { useWeatherStore } from '@/store/useWeatherStore'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const weatherStore = useWeatherStore()

const loading = ref(true)
const error = ref<string | null>(null)

const weatherStats = computed(() => [
  {
    value: 26.5,
    label: '平均温度',
    unit: '°C',
    icon: '🌡️',
    iconBg: '#ef4444'
  },
  {
    value: 68,
    label: '平均湿度',
    unit: '%',
    icon: '💧',
    iconBg: '#3b82f6'
  },
  {
    value: 420,
    label: '本月降水',
    unit: 'mm',
    icon: '🌧️',
    iconBg: '#8b5cf6'
  },
  {
    value: 186,
    label: '日照时数',
    unit: '小时',
    icon: '☀️',
    iconBg: '#f59e0b'
  }
])

const tempMonths = computed(() => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])

const tempHumiditySeries = computed(() => [
  {
    name: '平均温度(°C)',
    data: [-2, 2, 10, 18, 24, 28, 31, 30, 25, 17, 8, 1]
  },
  {
    name: '相对湿度(%)',
    data: [55, 58, 62, 65, 72, 78, 82, 80, 74, 66, 60, 56]
  }
])

const rainfallMonths = computed(() => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])

const rainfallSeries = computed(() => [{
  name: '降水量(mm)',
  data: [12, 18, 25, 45, 68, 95, 185, 165, 72, 38, 20, 10]
}])

const seasonalIndicators = computed(() => [
  { name: '春季', max: 100 },
  { name: '夏季', max: 100 },
  { name: '秋季', max: 100 },
  { name: '冬季', max: 100 }
])

const seasonalSeries = computed(() => [
  {
    name: '温度适宜度',
    value: [65, 85, 80, 25]
  },
  {
    name: '降水充足度',
    value: [55, 90, 70, 35]
  },
  {
    name: '日照满足率',
    value: [75, 88, 82, 55]
  }
])

interface WeatherAlert {
  level: 'info' | 'warning' | 'critical'
  icon: string
  type: string
  levelText: string
  message: string
  region: string
  time: string
  duration: string
}

const weatherAlerts = computed<WeatherAlert[]>(() => [
  {
    level: 'critical',
    icon: '🌩️',
    type: '暴雨红色预警',
    levelText: '严重',
    message: '预计未来12小时内，鲁南地区将出现大暴雨，局部特大暴雨，累计雨量可达150-200毫米，请做好防范准备。',
    region: '临沂、济宁、枣庄',
    time: '2小时前发布',
    duration: '12小时'
  },
  {
    level: 'warning',
    icon: '🌡️',
    type: '高温橙色预警',
    levelText: '警告',
    message: '预计未来3天，鲁西北地区最高气温将达到37°C以上，部分地区可达40°C，请注意防暑降温。',
    region: '德州、聊城、滨州',
    time: '5小时前发布',
    duration: '72小时'
  },
  {
    level: 'warning',
    icon: '💨',
    type: '大风蓝色预警',
    levelText: '警告',
    message: '预计今天夜间到明天白天，半岛地区将有7-8级阵风9级的偏北大风，海上风力更大，请注意防范。',
    region: '青岛、烟台、威海',
    time: '8小时前发布',
    duration: '24小时'
  },
  {
    level: 'info',
    icon: '🌫️',
    type: '大雾黄色预警',
    levelText: '提示',
    message: '今晨鲁中部分地区能见度低于500米，局地不足200米，出行请注意交通安全。',
    region: '济南、淄博、潍坊',
    time: '1小时前发布',
    duration: '6小时'
  }
])

interface FarmingAdvice {
  icon: string
  title: string
  text: string
  tags: string[]
}

const farmingAdvice = computed<FarmingAdvice[]>(() => [
  {
    icon: '🌾',
    title: '小麦收获期管理',
    text: '当前正值小麦成熟收获关键期，建议抓住晴好天气抢收抢晒，注意防范雷阵雨天气对收成的影响，确保颗粒归仓。',
    tags: ['小麦', '收获', '晾晒']
  },
  {
    icon: '🌽',
    title: '玉米播种与苗期管理',
    text: '近期气温回升，墒情适宜，是夏播玉米的最佳时期。播后及时查苗补苗，注意防治地下害虫和苗期病害。',
    tags: ['玉米', '播种', '苗期']
  },
  {
    icon: '🍅',
    title: '蔬菜大棚环境调控',
    text: '高温季节大棚内温湿度较高，需加强通风降温措施，适时遮阳，预防病虫害发生，保障蔬菜品质。',
    tags: ['蔬菜', '大棚', '病虫害']
  },
  {
    icon: '🍎',
    title: '果园水肥管理',
    text: '果实膨大期需水量较大，结合天气预报合理安排灌溉，追施膨果肥，同时注意疏果和套袋管理。',
    tags: ['果树', '灌溉', '施肥']
  }
])

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await weatherStore.actions.fetchWeatherData()
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
.weather-analysis {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.weather-analysis__header {
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

.current-weather {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.weather-icon {
  font-size: 40px;
}

.weather-info {
  display: flex;
  flex-direction: column;
}

.temp {
  font-size: 28px;
  font-weight: 700;
  color: #f59e0b;
}

.condition {
  font-size: 13px;
  color: #94a3b8;
}

.weather-analysis__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.weather__stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.weather__charts-top {
  width: 100%;
}

.weather__charts-middle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.weather__alerts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-card,
.alert-card,
.advice-card {
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
.advice-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.chart-card :deep(.base-card__title),
.alert-card :deep(.base-card__title),
.advice-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 450px;
  overflow-y: auto;
}

.weather-alert {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.weather-alert:hover {
  background: rgba(15, 23, 42, 0.6);
  transform: translateX(4px);
}

.weather-alert--critical { border-left-color: #ef4444; }
.weather-alert--warning { border-left-color: #f59e0b; }
.weather-alert--info { border-left-color: #3b82f6; }

.alert-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 10px;
  flex-shrink: 0;
}

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-type {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.alert-level-badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge--critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.badge--warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.badge--info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.alert-message {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.alert-footer {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #64748b;
  flex-wrap: wrap;
}

.alert-region {
  color: #93c5fd;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 450px;
  overflow-y: auto;
}

.advice-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.advice-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(15, 23, 42, 0.6);
}

.advice-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.2));
  border-radius: 10px;
  flex-shrink: 0;
}

.advice-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 6px 0;
}

.advice-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.advice-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.advice-tag {
  padding: 3px 10px;
  font-size: 11px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  color: #93c5fd;
}

.weather-analysis__error {
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
  .weather__charts-middle,
  .weather__alerts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .weather-analysis__header,
  .weather-analysis__main {
    padding: 16px;
  }

  .weather__stats-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
