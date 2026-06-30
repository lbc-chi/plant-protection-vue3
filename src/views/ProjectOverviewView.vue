<template>
  <div class="project-overview">
    <header class="project-overview__header">
      <div class="header__left">
        <h1 class="header__title">工程概况</h1>
        <p class="header__subtitle">山东省智慧植保工程建设项目总览</p>
      </div>
      <div class="header__right">
        <span class="project-phase">{{ currentPhase }}</span>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载工程数据..." />

    <div v-else-if="error" class="project-overview__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="project-overview__main">
      <section class="project__stats-row">
        <StatCard
          v-for="stat in projectStats"
          :key="stat.label"
          :value="stat.value"
          :label="stat.label"
          :unit="stat.unit"
          :icon="stat.icon"
          :icon-bg="stat.iconBg"
          :trend="stat.trend"
          :target-value="stat.targetValue"
          :show-progress="true"
          size="medium"
        />
      </section>

      <section class="project__grid-top">
        <BaseCard title="项目统计仪表盘" variant="shadow" class="dashboard-card">
          <div class="gauge-grid">
            <GaugeChart
              v-for="(gauge, index) in projectGauges"
              :key="index"
              :value="gauge.value"
              :min="0"
              :max="100"
              :title="gauge.title"
              unit="%"
              height="180px"
            />
          </div>
        </BaseCard>

        <BaseCard title="覆盖范围分析" variant="shadow" class="radar-card">
          <RadarChart
            :indicators="coverageIndicators"
            :series="coverageSeries"
            height="340px"
          />
        </BaseCard>
      </section>

      <section class="project__stations">
        <BaseCard title="站点分布情况" variant="shadow" class="station-card station-card--full">
          <div class="station-map">
            <div class="map-visual">
              <svg viewBox="0 0 800 500" class="province-svg">
                <defs>
                  <linearGradient id="stationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <rect width="800" height="500" fill="rgba(15, 30, 50, 0.5)" rx="12"/>
                <g class="connections">
                  <line
                    v-for="(conn, i) in stationConnections"
                    :key="'conn-' + i"
                    :x1="conn.x1" :y1="conn.y1"
                    :x2="conn.x2" :y2="conn.y2"
                    stroke="url(#stationGrad)"
                    stroke-width="1"
                    stroke-dasharray="4 4"
                    opacity="0.4"
                  />
                </g>
                <g class="station-points">
                  <g
                    v-for="(station, index) in stations"
                    :key="index"
                    class="station-group"
                  >
                    <circle
                      :cx="station.x" :cy="station.y"
                      :r="station.size"
                      :fill="station.color"
                      opacity="0.8"
                      class="station-circle"
                    >
                      <animate
                        attributeName="r"
                        :values="station.size + ';' + (station.size * 1.3) + ';' + station.size"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <text
                      :x="station.x" :y="station.y - station.size - 8"
                      text-anchor="middle"
                      fill="#e2e8f0"
                      font-size="11"
                      class="station-label"
                    >{{ station.name }}</text>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <div class="station-legend">
            <span
              v-for="(type, index) in stationTypes"
              :key="index"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: type.color }"></span>
              {{ type.name }} ({{ type.count }})
            </span>
          </div>
        </BaseCard>
      </section>

      <section class="project__timeline">
        <BaseCard title="工程建设时间线" variant="shadow" class="timeline-card timeline-card--full">
          <div class="timeline-container">
            <div class="timeline-track">
              <div
                v-for="(phase, index) in projectPhases"
                :key="index"
                :class="['timeline-phase', { 'phase--active': phase.active, 'phase--completed': phase.completed }]"
              >
                <div class="phase-marker">
                  <div class="marker-dot"></div>
                  <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                  <span class="phase-period">{{ phase.period }}</span>
                  <h4 class="phase-name">{{ phase.name }}</h4>
                  <p class="phase-desc">{{ phase.description }}</p>
                  <div class="phase-progress" v-if="phase.progress !== undefined">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: phase.progress + '%' }"
                        :class="{ 'fill-complete': phase.progress === 100 }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ phase.progress }}%</span>
                  </div>
                  <div class="phase-milestones">
                    <span
                      v-for="(ms, mi) in phase.milestones"
                      :key="mi"
                      :class="['milestone', { 'milestone--done': ms.done }]"
                    >
                      {{ ms.text }}
                    </span>
                  </div>
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
import { useProjectStore } from '@/store/useProjectStore'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const projectStore = useProjectStore()

const loading = ref(true)
const error = ref<string | null>(null)

const currentPhase = computed(() => '第二期建设中')

const projectStats = computed(() => [
  {
    value: 156,
    label: '监测站点',
    unit: '个',
    icon: '📍',
    iconBg: '#3b82f6',
    trend: 18.2,
    targetValue: 200
  },
  {
    value: 2847,
    label: '部署设备',
    unit: '台',
    icon: '📡',
    iconBg: '#10b981',
    trend: 24.5,
    targetValue: 3500
  },
  {
    value: 89.6,
    label: '覆盖率',
    unit: '%',
    icon: '🗺️',
    iconBg: '#8b5cf6',
    trend: 12.8,
    targetValue: 95
  },
  {
    value: 2.8,
    label: '投资金额',
    unit: '亿元',
    icon: '💰',
    iconBg: '#f59e0b',
    trend: 0,
    targetValue: 4.5
  }
])

const projectGauges = computed(() => [
  { title: '设备安装率', value: 81 },
  { title: '网络覆盖率', value: 94 },
  { title: '数据采集率', value: 97 },
  { title: '系统可用性', value: 99 }
])

const coverageIndicators = computed(() => [
  { name: '鲁中', max: 100 },
  { name: '鲁南', max: 100 },
  { name: '鲁西', max: 100 },
  { name: '胶东', max: 100 },
  { name: '鲁北', max: 100 },
  { name: '沿海', max: 100 }
])

const coverageSeries = computed(() => [
  {
    name: '覆盖率(%)',
    value: [92, 88, 85, 95, 78, 90]
  },
  {
    name: '设备密度',
    value: [78, 82, 70, 88, 65, 75]
  }
])

interface Station {
  name: string
  x: number
  y: number
  size: number
  color: string
}

const stations = computed<Station[]>(() => [
  { name: '济南中心站', x: 360, y: 140, size: 14, color: '#3b82f6' },
  { name: '青岛分站', x: 600, y: 300, size: 12, color: '#10b981' },
  { name: '临沂监测点', x: 550, y: 220, size: 10, color: '#f59e0b' },
  { name: '潍坊观测站', x: 450, y: 220, size: 11, color: '#8b5cf6' },
  { name: '烟台基站', x: 650, y: 140, size: 9, color: '#ef4444' },
  { name: '济宁节点', x: 430, y: 280, size: 10, color: '#06b6d4' },
  { name: '德州终端', x: 280, y: 80, size: 8, color: '#ec4899' },
  { name: '滨州网点', x: 380, y: 50, size: 7, color: '#84cc16' },
  { name: '菏泽枢纽', x: 400, y: 350, size: 11, color: '#f97316' },
  { name: '威海前哨', x: 700, y: 110, size: 8, color: '#14b8a6' }
])

const stationConnections = computed(() =>
  stations.value.slice(0, 5).flatMap((s, i) =>
    stations.value.slice(i + 1, i + 3).map(t => ({
      x1: s.x,
      y1: s.y,
      x2: t.x,
      y2: t.y
    }))
  )
)

const stationTypes = computed(() => [
  { name: '中心站', count: 1, color: '#3b82f6' },
  { name: '分站', count: 3, color: '#10b981' },
  { name: '监测点', count: 8, color: '#f59e0b' },
  { name: '观测站', count: 4, color: '#8b5cf6' }
])

interface ProjectPhase {
  period: string
  name: string
  description: string
  progress?: number
  active?: boolean
  completed?: boolean
  milestones: Array<{ text: string; done: boolean }>
}

const projectPhases = computed<ProjectPhase[]>(() => [
  {
    period: '2023.01 - 2023.06',
    name: '一期：基础设施建设',
    description: '完成省级数据中心建设，搭建基础网络架构，部署首批50个监测站点。',
    progress: 100,
    completed: true,
    milestones: [
      { text: '数据中心建成', done: true },
      { text: '网络骨干开通', done: true },
      { text: '首批站点上线', done: true }
    ]
  },
  {
    period: '2023.07 - 2024.06',
    name: '二期：系统平台开发',
    description: '开发智慧植保管理平台，集成虫害识别、气象预警、数据分析等核心功能模块。',
    progress: 100,
    completed: true,
    milestones: [
      { text: '平台主体开发', done: true },
      { text: 'AI模型训练', done: true },
      { text: '功能联调测试', done: true }
    ]
  },
  {
    period: '2024.07 - 2025.12',
    name: '三期：全面推广应用',
    description: '在全省范围内推广部署，扩大监测覆盖范围，完善运维服务体系，提升用户使用体验。',
    progress: 72,
    active: true,
    milestones: [
      { text: '全省推广部署', done: true },
      { text: '培训服务体系', done: false },
      { text: '优化迭代升级', done: false }
    ]
  },
  {
    period: '2026.01 - 2026.12',
    name: '四期：智能升级阶段',
    description: '引入边缘计算和AI大模型技术，实现病虫害智能预测和精准防治决策支持。',
    progress: 15,
    milestones: [
      { text: '边缘计算节点', done: false },
      { text: 'AI大模型接入', done: false },
      { text: '智能决策引擎', done: false }
    ]
  }
])

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await projectStore.actions.fetchProjectData()
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
.project-overview {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.project-overview__header {
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

.project-phase {
  padding: 10px 22px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #2F6F9F;
}

.project-overview__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.project__stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.project__grid-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.dashboard-card,
.radar-card,
.station-card,
.timeline-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.station-card--full,
.timeline-card--full {
  width: 100%;
}

.dashboard-card :deep(.base-card__header),
.radar-card :deep(.base-card__header),
.station-card :deep(.base-card__header),
.timeline-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.dashboard-card :deep(.base-card__title),
.radar-card :deep(.base-card__title),
.station-card :deep(.base-card__title),
.timeline-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .gauge-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.station-map {
  padding: 16px;
}

.map-visual {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(10, 22, 40, 0.5);
}

.province-svg {
  width: 100%;
  height: auto;
  display: block;
}

.station-circle {
  cursor: pointer;
  transition: all 0.3s ease;
}

.station-circle:hover {
  filter: brightness(1.3);
}

.station-label {
  pointer-events: none;
  opacity: 0.85;
}

.station-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 14px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.timeline-container {
  padding: 20px;
  overflow-x: auto;
}

.timeline-track {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  min-width: 700px;
}

.timeline-phase {
  display: flex;
  gap: 24px;
  position: relative;
  padding-bottom: 28px;
}

.phase-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
  z-index: 2;
}

.marker-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(51, 65, 85, 0.8);
  border: 3px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.phase--active .marker-dot {
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  border-color: transparent;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.5), 0 0 28px rgba(124, 58, 237, 0.25);
}

.phase--completed .marker-dot {
  background: #10b981;
  border-color: transparent;
}

.marker-line {
  width: 2px;
  flex: 1;
  background: rgba(59, 130, 246, 0.2);
  margin-top: 4px;
}

.phase-content {
  flex: 1;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 10px;
  padding: 18px 20px;
  transition: all 0.3s ease;
}

.phase-content:hover {
  border-color: rgba(59, 130, 246, 0.25);
  background: rgba(15, 23, 42, 0.6);
}

.phase--active .phase-content {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.08);
}

.phase-period {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.phase-name {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 6px 0 8px 0;
}

.phase-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 14px 0;
}

.phase-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #7c3aed);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.fill-complete {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #2F6F9F;
  min-width: 36px;
  text-align: right;
}

.phase-milestones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.milestone {
  padding: 4px 10px;
  font-size: 11px;
  background: rgba(51, 65, 85, 0.4);
  border-radius: 6px;
  color: #64748b;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.milestone--done {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.25);
}

.project-overview__error {
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
  .project__grid-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .project-overview__header,
  .project-overview__main {
    padding: 16px;
  }

  .project__stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .gauge-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
