<template>
  <div class="overview">
    <header class="overview__header">
      <h1 class="overview__title">数据概览</h1>
      <p class="overview__subtitle">全省植保监测数据总览</p>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载数据概览..." />

    <div v-else-if="error" class="overview__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="overview__main">
      <section class="overview__stats">
        <StatCard
          v-for="stat in statsCards"
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

      <section class="overview__content">
        <BaseCard title="全省设备分布" variant="shadow" class="map-card">
          <div class="map-container">
            <div class="map-placeholder">
              <div class="map-grid">
                <div
                  v-for="(point, index) in mapPoints"
                  :key="index"
                  class="map-point"
                  :style="{ left: point.x + '%', top: point.y + '%' }"
                  :title="point.name"
                >
                  <span class="point-dot" :class="'point--' + point.level"></span>
                  <span v-if="point.showLabel" class="point-label">{{ point.name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot legend--high"></span>高风险</span>
            <span class="legend-item"><span class="legend-dot legend--medium"></span>中风险</span>
            <span class="legend-item"><span class="legend-dot legend--low"></span>低风险</span>
          </div>
        </BaseCard>

        <BaseCard title="数据明细" variant="shadow" class="table-card">
          <template #extra>
            <div class="table-controls">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索地区/设备..."
                class="search-input"
              />
              <select v-model="filterType" class="filter-select">
                <option value="">全部类型</option>
                <option value="pest_monitoring_lamp">测报灯</option>
                <option value="sex_pheromone_trap">性诱器</option>
                <option value="weather_station">气象站</option>
              </select>
            </div>
          </template>
          <DataTable
            :columns="tableColumns"
            :data="filteredTableData"
            :pagination="true"
            :page-size="10"
          />
        </BaseCard>
      </section>

      <section class="overview__charts">
        <BaseCard title="月度数据趋势" variant="shadow" class="chart-card">
          <LineChart
            :x-axis-data="trendMonths"
            :series="trendSeries"
            :smooth="true"
            height="300px"
          />
        </BaseCard>

        <BaseCard title="设备类型分布" variant="shadow" class="chart-card">
          <PieChart
            :data="pieData"
            height="300px"
          />
        </BaseCard>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useDeviceStore } from '@/store/useDeviceStore'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const dashboardStore = useDashboardStore()
const deviceStore = useDeviceStore()

const loading = ref(true)
const error = ref<string | null>(null)
const searchKeyword = ref('')
const filterType = ref('')

const overview = computed(() => dashboardStore.getters.overview.value)

const statsCards = computed(() => {
  const ov = overview.value
  if (!ov) return []
  return [
    { value: ov.totalDevices, label: '设备总数', unit: '台', icon: '📡', iconBg: '#3b82f6', trend: 12.5 },
    { value: ov.onlineDevices, label: '在线设备', unit: '台', icon: '🟢', iconBg: '#10b981', trend: 8.3 },
    { value: ov.totalAlerts, label: '告警总数', unit: '条', icon: '⚠️', iconBg: '#f59e0b', trend: -5.2 },
    { value: ov.coverageArea, label: '覆盖面积', unit: '万亩', icon: '🗺️', iconBg: '#8b5cf6', trend: 15.8 }
  ]
})

const mapPoints = computed(() => [
  { name: '济南', x: 45, y: 30, level: 'high', showLabel: true },
  { name: '青岛', x: 70, y: 65, level: 'medium', showLabel: true },
  { name: '临沂', x: 75, y: 45, level: 'high', showLabel: true },
  { name: '潍坊', x: 58, y: 48, level: 'medium', showLabel: false },
  { name: '烟台', x: 78, y: 25, level: 'low', showLabel: true },
  { name: '济宁', x: 55, y: 55, level: 'medium', showLabel: false },
  { name: '泰安', x: 50, y: 42, level: 'low', showLabel: false },
  { name: '淄博', x: 42, y: 38, level: 'low', showLabel: false },
  { name: '威海', x: 82, y: 22, level: 'low', showLabel: false },
  { name: '日照', x: 77, y: 55, level: 'medium', showLabel: false }
])

const tableColumns = computed(() => [
  { key: 'regionName', label: '地区', width: '120px' },
  { key: 'deviceCount', label: '设备数', width: '80px' },
  { key: 'onlineCount', label: '在线数', width: '80px' },
  { key: 'alertCount', label: '告警数', width: '80px' },
  { key: 'coverage', label: '覆盖率', width: '100px' },
  { key: 'status', label: '状态', width: '100px' }
])

const tableData = computed(() => {
  const regions = deviceStore.getters.devicesByRegion.value
  return regions.map(r => ({
    regionName: r.regionName,
    deviceCount: r.totalCount,
    onlineCount: r.onlineCount,
    alertCount: Math.floor(Math.random() * 20),
    coverage: r.totalCount > 0 ? ((r.onlineCount / r.totalCount) * 100).toFixed(1) + '%' : '0%',
    status: r.onlineCount / r.totalCount > 0.8 ? '正常' : r.onlineCount / r.totalCount > 0.5 ? '警告' : '异常'
  }))
})

const filteredTableData = computed(() => {
  let data = tableData.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(d => d.regionName.toLowerCase().includes(keyword))
  }
  return data
})

const trendMonths = computed(() => ['1月', '2月', '3月', '4月', '5月', '6月'])

const trendSeries = computed(() => [
  {
    name: '数据采集量',
    data: [1200, 1800, 2400, 2800, 3200, 3600]
  },
  {
    name: '告警处理量',
    data: [80, 120, 150, 180, 200, 220]
  }
])

const pieData = computed(() => {
  const types = deviceStore.getters.devicesByType.value
  return types.map(t => ({
    name: t.typeName,
    value: t.count
  }))
})

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([
      dashboardStore.actions.fetchDashboardData(),
      deviceStore.actions.fetchDeviceData()
    ])
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
.overview {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.overview__header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.overview__title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #2F6F9F, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.overview__subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.overview__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.overview__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.overview__charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.map-card,
.table-card,
.chart-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.map-card :deep(.base-card__header),
.table-card :deep(.base-card__header),
.chart-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.map-card :deep(.base-card__title),
.table-card :deep(.base-card__title),
.chart-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.map-container {
  position: relative;
  width: 100%;
  height: 350px;
  background: rgba(15, 30, 50, 0.5);
  border-radius: 8px;
  overflow: hidden;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-grid {
  width: 100%;
  height: 100%;
  position: relative;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0);
  background-size: 30px 30px;
}

.map-point {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.point-dot {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.point-dot:hover {
  transform: scale(1.15);
}

.point--high {
  background: #ef4444;
  box-shadow: 0 0 12px #ef4444, 0 0 20px rgba(239, 68, 68, 0.25);
}
.point--high:hover { box-shadow: 0 0 16px #ef4444, 0 0 28px rgba(239, 68, 68, 0.35); }

.point--medium {
  background: #f59e0b;
  box-shadow: 0 0 12px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.25);
}
.point--medium:hover { box-shadow: 0 0 16px #f59e0b, 0 0 28px rgba(245, 158, 11, 0.35); }

.point--low {
  background: #10b981;
  box-shadow: 0 0 12px #10b981, 0 0 20px rgba(16, 185, 129, 0.25);
}
.point--low:hover { box-shadow: 0 0 16px #10b981, 0 0 28px rgba(16, 185, 129, 0.35); }

.point-label {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend--high { background: #ef4444; }
.legend--medium { background: #f59e0b; }
.legend--low { background: #10b981; }

.table-controls {
  display: flex;
  gap: 12px;
}

.search-input {
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
  width: 200px;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select {
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.overview__error {
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
  .overview__content,
  .overview__charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .overview__main {
    padding: 16px;
  }

  .overview__stats {
    grid-template-columns: 1fr;
  }

  .table-controls {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>
