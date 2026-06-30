<template>
  <div class="device-list">
    <header class="device-list__header">
      <div class="header__left">
        <h1 class="header__title">设备管理</h1>
        <p class="header__subtitle">共 {{ totalDevices }} 台设备 · 在线率 {{ onlineRate }}%</p>
      </div>
      <div class="header__right">
        <div class="status-summary">
          <span class="status-item status--online">
            <span class="status-dot"></span>在线 {{ onlineDevices.length }}
          </span>
          <span class="status-item status--offline">
            <span class="status-dot"></span>离线 {{ offlineDevices.length }}
          </span>
          <span class="status-item status--fault">
            <span class="status-dot"></span>故障 {{ faultDevices.length }}
          </span>
        </div>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载设备数据..." />

    <div v-else-if="error" class="device-list__error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <main v-else class="device-list__main">
      <section class="device-list__filters">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索设备名称/编号/地区..."
          class="search-input"
        />
        <div class="filter-group">
          <button
            v-for="type in deviceTypes"
            :key="type.value"
            :class="['filter-btn', { 'filter-btn--active': selectedType === type.value }]"
            @click="selectedType = type.value"
          >
            {{ type.label }}
          </button>
        </div>
        <div class="view-toggle">
          <button
            :class="['toggle-btn', { 'toggle-btn--active': viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
          >⊞ 网格</button>
          <button
            :class="['toggle-btn', { 'toggle-btn--active': viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >☰ 列表</button>
        </div>
      </section>

      <section v-if="viewMode === 'grid'" class="device-grid">
        <BaseCard
          v-for="device in filteredDevices"
          :key="device.id"
          :hoverable="true"
          class="device-card"
          @click="$router.push(`/devices/${device.id}`)"
        >
          <template #header>
            <div class="device-card__header">
              <div class="device-card__info">
                <span class="device-type-icon">{{ getTypeIcon(device.type) }}</span>
                <div>
                  <h3 class="device-name">{{ device.name }}</h3>
                  <span class="device-code">{{ device.code }}</span>
                </div>
              </div>
              <span :class="['status-badge', `status-badge--${device.status}`]">
                {{ getStatusText(device.status) }}
              </span>
            </div>
          </template>

          <div class="device-card__body">
            <div class="device-detail-row">
              <span class="detail-label">型号</span>
              <span class="detail-value">{{ device.model }}</span>
            </div>
            <div class="device-detail-row">
              <span class="detail-label">厂商</span>
              <span class="detail-value">{{ device.manufacturer }}</span>
            </div>
            <div class="device-detail-row">
              <span class="detail-label">位置</span>
              <span class="detail-value">{{ device.regionName }} - {{ device.stationName }}</span>
            </div>
            <div class="device-detail-row">
              <span class="detail-label">最后在线</span>
              <span class="detail-value">{{ formatTime(device.lastOnlineTime) }}</span>
            </div>
          </div>
        </BaseCard>
      </section>

      <section v-else class="device-table-section">
        <BaseCard variant="shadow" class="table-card">
          <DataTable
            :columns="tableColumns"
            :data="tableData"
            :pagination="true"
            :page-size="15"
            @row-click="handleRowClick"
          />
        </BaseCard>
      </section>

      <div v-if="filteredDevices.length === 0" class="empty-state">
        <EmptyState description="没有找到匹配的设备" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/store/useDeviceStore'
import type { Device, DeviceType, DeviceStatus } from '@/types/device'
import BaseCard from '@/components/ui/BaseCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const router = useRouter()
const deviceStore = useDeviceStore()

const loading = ref(true)
const error = ref<string | null>(null)
const searchKeyword = ref('')
const selectedType = ref<DeviceType | ''>('')
const viewMode = ref<'grid' | 'table'>('grid')

const deviceTypes = [
  { value: '', label: '全部' },
  { value: 'pest_monitoring_lamp', label: '测报灯' },
  { value: 'sex_pheromone_trap', label: '性诱器' },
  { value: 'weather_station', label: '气象站' }
]

const totalDevices = computed(() => deviceStore.getters.totalDevices.value)
const onlineDevices = computed(() => deviceStore.getters.onlineDevices.value)
const offlineDevices = computed(() => deviceStore.getters.offlineDevices.value)
const faultDevices = computed(() => deviceStore.getters.faultDevices.value)
const onlineRate = computed(() => deviceStore.getters.onlineRate.value)

const filteredDevices = computed(() => {
  let devices = deviceStore.state.deviceList.value

  if (selectedType.value) {
    devices = devices.filter(d => d.type === selectedType.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    devices = deviceStore.actions.searchDevices(keyword)
    if (selectedType.value) {
      devices = devices.filter(d => d.type === selectedType.value)
    }
  }

  return devices
})

const tableColumns = computed(() => [
  { key: 'name', label: '设备名称', width: '150px' },
  { key: 'code', label: '设备编号', width: '140px' },
  { key: 'type', label: '类型', width: '100px' },
  { key: 'regionName', label: '所属地区', width: '120px' },
  { key: 'stationName', label: '站点名称', width: '120px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'lastOnlineTime', label: '最后在线', width: '160px' }
])

const tableData = computed(() =>
  filteredDevices.value.map(d => ({
    ...d,
    type: getTypeName(d.type),
    status: getStatusText(d.status),
    lastOnlineTime: formatTime(d.lastOnlineTime)
  }))
)

function getTypeIcon(type: DeviceType): string {
  const icons: Record<DeviceType, string> = {
    pest_monitoring_lamp: '💡',
    sex_pheromone_trap: '🪤',
    weather_station: '🌡️',
    soil_sensor: '🌱',
    camera: '📷',
    spore_trap: '🔬',
    light_trap: '✨',
    other: '📦'
  }
  return icons[type] || '📦'
}

function getTypeName(type: DeviceType): string {
  const names: Record<DeviceType, string> = {
    pest_monitoring_lamp: '测报灯',
    sex_pheromone_trap: '性诱器',
    weather_station: '气象站',
    soil_sensor: '土壤传感器',
    camera: '摄像头',
    spore_trap: '孢子捕捉仪',
    light_trap: '杀虫灯',
    other: '其他'
  }
  return names[type] || type
}

function getStatusText(status: DeviceStatus): string {
  const texts: Record<DeviceStatus, string> = {
    online: '在线',
    offline: '离线',
    fault: '故障',
    maintenance: '维护中',
    inactive: '停用'
  }
  return texts[status] || status
}

function formatTime(time: string): string {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleRowClick(row: Record<string, unknown>) {
  const id = (row as Device).id
  if (id) router.push(`/devices/${id}`)
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await deviceStore.actions.fetchDeviceData()
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
.device-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.device-list__header {
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

.status-summary {
  display: flex;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status--online .status-dot { background: #10b981; box-shadow: 0 0 8px #10b981, 0 0 16px rgba(16, 185, 129, 0.3); }
.status--offline .status-dot { background: #6b7280; }
.status--fault .status-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444, 0 0 16px rgba(239, 68, 68, 0.3); }

.device-list__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-list__filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
  padding: 12px 18px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-input::placeholder {
  color: #64748b;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 10px 18px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: rgba(59, 130, 246, 0.5);
  color: #e2e8f0;
}

.filter-btn--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.2));
  border-color: #3b82f6;
  color: #2F6F9F;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.toggle-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn--active {
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  color: white;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.device-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.device-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.15);
}

.device-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.device-card__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-type-icon {
  font-size: 28px;
}

.device-name {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.device-code {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge--online {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge--offline {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-badge--fault {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge--maintenance {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.device-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(59, 130, 246, 0.1);
}

.device-detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
}

.detail-value {
  font-size: 13px;
  color: #cbd5e1;
  text-align: right;
}

.table-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.device-list__error {
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

@media (max-width: 768px) {
  .device-list__header,
  .device-list__main {
    padding: 16px;
  }

  .device-grid {
    grid-template-columns: 1fr;
  }

  .device-list__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
  }

  .filter-group {
    overflow-x: auto;
  }
}
</style>
