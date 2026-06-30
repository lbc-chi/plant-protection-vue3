<template>
  <div class="chart-container" :style="{ width: widthStyle, height: heightStyle }">
    <!-- 加载状态 -->
    <div v-if="loading" class="chart-container__loading">
      <div class="chart-loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="chart-container__error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
      <button v-if="$emit" class="retry-btn" @click="$emit('retry')">重试</button>
    </div>

    <!-- 空数据 -->
    <div v-else-if="isEmpty" class="chart-container__empty">
      <span class="empty-icon">📊</span>
      <span class="empty-text">暂无数据</span>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <div v-if="$slots.header" class="chart-container__header">
        <slot name="header" />
      </div>
      <div ref="chartDomRef" class="chart-container__body"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from '@/utils/echarts'

interface Props {
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  isEmpty: false,
  width: '100%',
  height: '100%'
})

const emit = defineEmits<{
  (e: 'ready', chart: echarts.ECharts): void
  (e: 'retry'): void
}>()

const chartDomRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const widthStyle = typeof props.width === 'number' ? `${props.width}px` : props.width
const heightStyle = typeof props.height === 'number' ? `${props.height}px` : props.height

function initChart() {
  if (!chartDomRef.value || props.loading || props.error || props.isEmpty) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartDomRef.value, 'plantProtection')
  emit('ready', chartInstance)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

watch(() => props.loading, (val) => {
  if (!val) {
    setTimeout(() => initChart(), 50)
  }
})

defineExpose({
  getInstance: () => chartInstance
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.chart-container__body {
  width: 100%;
  height: 100%;
}

.chart-container__loading,
.chart-container__error,
.chart-container__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.chart-loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(47, 111, 159, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: chartSpin 0.8s linear infinite;
}

@keyframes chartSpin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 28px;
}

.error-text {
  color: var(--color-accent-orange);
  font-weight: 500;
}

.empty-icon {
  font-size: 28px;
  opacity: 0.5;
}

.retry-btn {
  padding: 4px 14px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: var(--glass-bg);
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  border-color: var(--glass-border-hover);
  color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.chart-container__header {
  padding: 4px 0;
}
</style>