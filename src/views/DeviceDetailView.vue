<template>
  <div class="device-detail">
    <header class="device-detail__header">
      <div class="header__left">
        <button class="back-btn" @click="$router.push('/devices')">
          ← 返回列表
        </button>
        <div class="device-title-group" v-if="device">
          <span class="device-type-icon">{{ getTypeIcon(device.type) }}</span>
          <div>
            <h1 class="device-name">{{ device.name }}</h1>
            <p class="device-code">{{ device.code }} · {{ getTypeName(device.type) }}</p>
          </div>
        </div>
      </div>
      <div class="header__right" v-if="device">
        <span :class="['status-badge', `status-badge--${device.status}`]">
          {{ getStatusText(device.status) }}
        </span>
      </div>
    </header>

    <LoadingSpinner v-if="loading" size="large" text="加载设备详情..." />

    <div v-else-if="error || !device" class="device-detail__error">
      <p>{{ error || '设备不存在' }}</p>
      <button @click="$router.push('/devices')" class="retry-btn">返回列表</button>
    </div>

    <main v-else class="device-detail__main">
      <section class="detail-grid">
        <BaseCard title="基本信息" variant="shadow" class="info-card">
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">设备型号</span>
              <span class="info-value">{{ device.model }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">制造商</span>
              <span class="info-value">{{ device.manufacturer }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属地区</span>
              <span class="info-value">{{ device.regionName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属站点</span>
              <span class="info-value">{{ device.stationName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">安装日期</span>
              <span class="info-value">{{ formatDate(device.installDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">固件版本</span>
              <span class="info-value">{{ device.firmwareVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后在线</span>
              <span class="info-value">{{ formatTime(device.lastOnlineTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">坐标位置</span>
              <span class="info-value">{{ device.longitude.toFixed(4) }}, {{ device.latitude.toFixed(4) }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="运行状态监控" variant="shadow" class="status-card">
          <div class="status-monitor">
            <div class="monitor-item">
              <div class="monitor-icon">📶</div>
              <div class="monitor-info">
                <span class="monitor-label">信号强度</span>
                <span class="monitor-value">{{ device.signalStrength ?? '-' }} dBm</span>
              </div>
              <div class="monitor-bar">
                <div
                  class="monitor-bar-fill"
                  :style="{ width: `${Math.min(((device.signalStrength ?? -100 + 100) / 70) * 100, 100)}%` }"
                  :class="{ 'bar-good': (device.signalStrength ?? -50) > -60, 'bar-warning': (device.signalStrength ?? -50) <= -60 && (device.signalStrength ?? -50) > -80, 'bar-bad': (device.signalStrength ?? -50) <= -80 }"
                ></div>
              </div>
            </div>

            <div class="monitor-item">
              <div class="monitor-icon">🔋</div>
              <div class="monitor-info">
                <span class="monitor-label">电池电量</span>
                <span class="monitor-value">{{ device.batteryLevel ?? '-' }}%</span>
              </div>
              <div class="monitor-bar">
                <div
                  class="monitor-bar-fill"
                  :style="{ width: `${device.batteryLevel ?? 0}%` }"
                  :class="{ 'bar-good': (device.batteryLevel ?? 0) > 50, 'bar-warning': (device.batteryLevel ?? 0) <= 50 && (device.batteryLevel ?? 0) > 20, 'bar-bad': (device.batteryLevel ?? 0) <= 20 }"
                ></div>
              </div>
            </div>

            <div class="monitor-item">
              <div class="monitor-icon">⏱️</div>
              <div class="monitor-info">
                <span class="monitor-label">采集间隔</span>
                <span class="monitor-value">{{ device.config.collectionInterval }} 分钟</span>
              </div>
            </div>

            <div class="monitor-item">
              <div class="monitor-icon">☁️</div>
              <div class="monitor-info">
                <span class="monitor-label">上传间隔</span>
                <span class="monitor-value">{{ device.config.uploadInterval }} 分钟</span>
              </div>
            </div>

            <div class="monitor-item">
              <div class="monitor-icon">🔄</div>
              <div class="monitor-info">
                <span class="monitor-label">自动重启</span>
                <span class="monitor-value" :class="{ 'value-on': device.config.autoRestart }">
                  {{ device.config.autoRestart ? '已开启' : '已关闭' }}
                </span>
              </div>
            </div>

            <div class="monitor-item">
              <div class="monitor-icon">💾</div>
              <div class="monitor-info">
                <span class="monitor-label">数据保留</span>
                <span class="monitor-value">{{ device.config.dataRetentionDays }} 天</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section class="chart-section">
        <BaseCard title="历史数据趋势" variant="shadow" class="chart-card chart-card--full">
          <LineChart
            :x-axis-data="historyTimeLabels"
            :series="historySeriesData"
            :smooth="true"
            :area-style="true"
            height="320px"
          />
        </BaseCard>
      </section>

      <section class="maintenance-section">
        <BaseCard title="维护记录" variant="shadow" class="maint-card">
          <div class="maintenance-timeline">
            <div v-for="(record, index) in maintenanceRecords" :key="index" class="timeline-item">
              <div class="timeline-dot" :class="'dot--' + record.result"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">{{ getMaintenanceTypeText(record.type) }}</span>
                  <span class="timeline-time">{{ formatDate(record.startTime) }}</span>
                </div>
                <p class="timeline-desc">{{ record.description }}</p>
                <div class="timeline-meta">
                  <span>技术员：{{ record.technician }}</span>
                  <span :class="['result-badge', 'result--' + record.result]">
                    {{ getMaintenanceResultText(record.result) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="maintenanceRecords.length === 0" class="no-records">
              暂无维护记录
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
import { useDeviceStore } from '@/store/useDeviceStore'
import type { Device, DeviceType, DeviceStatus, MaintenanceRecord, MaintenanceType, MaintenanceResult } from '@/types/device'
import BaseCard from '@/components/ui/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const deviceStore = useDeviceStore()

const loading = ref(true)
const error = ref<string | null>(null)

const deviceId = computed(() => route.params.id as string)

const device = computed(() => deviceStore.actions.getDeviceById(deviceId.value))

const historyTimeLabels = computed(() => {
  const labels = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return labels
})

const historySeriesData = computed(() => [
  {
    name: '采集数据量',
    data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200 + 100))
  },
  {
    name: '告警次数',
    data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10))
  }
])

const maintenanceRecords = computed<MaintenanceRecord[]>(() => [
  {
    id: '1',
    deviceId: deviceId.value,
    deviceName: device.value?.name ?? '',
    type: 'routine',
    description: '定期巡检，检查设备运行状态，清洁传感器探头',
    technician: '张工',
    startTime: '2025-05-20T09:00:00Z',
    endTime: '2025-05-20T10:30:00Z',
    result: 'success'
  },
  {
    id: '2',
    deviceId: deviceId.value,
    deviceName: device.value?.name ?? '',
    type: 'calibration',
    description: '温湿度传感器校准，调整测量偏差至标准范围',
    technician: '李工',
    startTime: '2025-05-10T14:00:00Z',
    endTime: '2025-05-10T15:30:00Z',
    result: 'success'
  },
  {
    id: '3',
    deviceId: deviceId.value,
    deviceName: device.value?.name ?? '',
    type: 'repair',
    description: '通信模块故障维修，更换损坏的通信芯片',
    technician: '王工',
    startTime: '2025-04-28T08:00:00Z',
    endTime: '2025-04-28T16:00:00Z',
    partsReplaced: ['通信模块'],
    result: 'success'
  },
  {
    id: '4',
    deviceId: deviceId.value,
    deviceName: device.value?.name ?? '',
    type: 'routine',
    description: '季度例行维护，检查电源系统和存储状态',
    technician: '赵工',
    startTime: '2025-04-01T09:00:00Z',
    endTime: '2025-04-01T11:00:00Z',
    result: 'partial'
  }
])

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
    online: '运行中',
    offline: '离线',
    fault: '故障',
    maintenance: '维护中',
    inactive: '停用'
  }
  return texts[status] || status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

function getMaintenanceTypeText(type: MaintenanceType): string {
  const texts: Record<MaintenanceType, string> = {
    routine: '例行维护',
    repair: '故障维修',
    calibration: '校准',
    upgrade: '升级',
    replacement: '更换'
  }
  return texts[type] || type
}

function getMaintenanceResultText(result: MaintenanceResult): string {
  const texts: Record<MaintenanceResult, string> = {
    success: '完成',
    partial: '部分完成',
    failed: '失败',
    pending: '进行中'
  }
  return texts[result] || result
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

watch(deviceId, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.device-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #e2e8f0;
}

.device-detail__header {
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

.device-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-type-icon {
  font-size: 36px;
}

.device-name {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 4px 0;
}

.device-code {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.status-badge {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
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

.device-detail__main {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-card,
.status-card,
.chart-card,
.maint-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.info-card :deep(.base-card__header),
.status-card :deep(.base-card__header),
.chart-card :deep(.base-card__header),
.maint-card :deep(.base-card__header) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom-color: rgba(59, 130, 246, 0.2);
}

.info-card :deep(.base-card__title),
.status-card :deep(.base-card__title),
.chart-card :deep(.base-card__title),
.maint-card :deep(.base-card__title) {
  color: #e2e8f0;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed rgba(59, 130, 246, 0.12);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #64748b;
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: #cbd5e1;
  text-align: right;
  word-break: break-all;
}

.status-monitor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.monitor-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.monitor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.monitor-label {
  font-size: 12px;
  color: #64748b;
}

.monitor-value {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.value-on {
  color: #10b981 !important;
}

.monitor-bar {
  width: 120px;
  height: 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.monitor-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bar-good { background: linear-gradient(90deg, #10b981, #34d399); }
.bar-warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-bad { background: linear-gradient(90deg, #ef4444, #f87171); }

.chart-section {
  width: 100%;
}

.chart-card--full {
  width: 100%;
}

.maintenance-timeline {
  position: relative;
  padding-left: 28px;
}

.maintenance-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #3b82f6, #7c3aed);
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #0a1628;
}

.dot--success { background: #10b981; }
.dot--partial { background: #f59e0b; }
.dot--failed { background: #ef4444; }
.dot--pending { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.2); }

.timeline-content {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  padding: 14px 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-type {
  font-size: 13px;
  font-weight: 600;
  color: #2F6F9F;
}

.timeline-time {
  font-size: 12px;
  color: #64748b;
}

.timeline-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.timeline-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}

.result-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.result--success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.result--partial { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.result--failed { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.result--pending { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.no-records {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
}

/* 移除闪烁动画 — 持续光晕替代 */

.device-detail__error {
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

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .device-detail__header,
  .device-detail__main {
    padding: 16px;
  }
}
</style>
