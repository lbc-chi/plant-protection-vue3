<template>
  <div 
    class="echarts-wrapper" 
    ref="wrapperRef"
    :class="{ 'echarts-wrapper--loading': isLoading, 'echarts-wrapper--error': !!error }"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">{{ loadingText }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-if="error && !isLoading" class="error-overlay" @click="retry">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error.message }}</div>
      <button class="retry-btn">点击重试</button>
    </div>

    <!-- 图表容器 -->
    <div ref="chartRef" class="chart-container"></div>

    <!-- 插槽：自定义覆盖层（如图例、工具栏等） -->
    <div v-if="$slots.overlay" class="custom-overlay">
      <slot name="overlay"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, provide } from 'vue'
import * as echarts from '@/utils/echarts'

// ============================================
// 类型定义
// ============================================

type EChartsOption = echarts.EChartsOption

// ============================================
// Props 定义
// ============================================

interface Props {
  /** ECharts option 配置 */
  option?: EChartsOption | null
  /** 主题名称或主题对象 */
  theme?: string | object
  /** 是否手动合并 option（而非替换） */
  notMerge?: boolean
  /** 是否懒更新 */
  lazyUpdate?: boolean
  /** 显示加载状态 */
  loading?: boolean
  /** 加载提示文字 */
  loadingText?: string
  /** 是否自动 resize */
  autoResize?: boolean
  /** resize 防抖延迟(ms) */
  resizeDelay?: number
  /** 高度 */
  height?: string | number
  /** 宽度 */
  width?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  option: () => ({}),
  theme: undefined,
  notMerge: false,
  lazyUpdate: false,
  loading: false,
  loadingText: '加载中...',
  autoResize: true,
  resizeDelay: 200,
  height: '100%',
  width: '100%'
})

// ============================================
// Emits 定义
// ============================================

const emit = defineEmits<{
  (e: 'ready', instance: echarts.ECharts): void
  (e: 'resize', size: { width: number; height: number }): void
  (e: 'click', params: any): void
  (e: 'dblclick', params: any): void
  (e: 'mouseover', params: any): void
  (e: 'mouseout', params: any): void
  (e: 'rendered'): void
  (e: 'finished'): void
  (e: 'error', error: Error): void
}>()

// ============================================
// 响应式状态
// ============================================

const wrapperRef = ref<HTMLDivElement>()
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
const isLoading = ref(props.loading)
const error = ref<Error | null>(null)
let resizeObserver: ResizeObserver | null = null
const isChartReady = ref(false)

// ============================================
// 核心方法
// ============================================

/**
 * 初始化 ECharts 实例
 */
function initChart() {
  if (!chartRef.value) return
  
  try {
    // 销毁旧实例（如果存在）
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }

    // 创建新实例
    chartInstance = echarts.init(chartRef.value, props.theme, {
      renderer: 'canvas',
      locale: 'ZH'
    })

    // 绑定事件
    bindEvents()

    // 设置初始 option
    if (props.option) {
      chartInstance.setOption(props.option, {
        notMerge: props.notMerge,
        lazyUpdate: props.lazyUpdate
      })
    }

    emit('ready', chartInstance)

    isChartReady.value = true

  } catch (err) {
    console.error('[EChartsWrapper] ❌ 初始化失败:', err)
    error.value = err as Error
    emit('error', error.value)
  }
}

/**
 * 绑定 ECharts 事件
 */
function bindEvents() {
  if (!chartInstance) return

  const events = ['click', 'dblclick', 'mouseover', 'mouseout', 'rendered', 'finished']
  
  events.forEach(eventName => {
    chartInstance!.on(eventName as any, (params: any) => {
      emit(eventName as any, params)
    })
  })
}

/**
 * 更新图表配置
 */
function setOption(option: EChartsOption, clear?: boolean) {
  if (!chartInstance) return
  
  try {
    chartInstance.setOption(option || {}, {
      notMerge: clear ?? props.notMerge,
      lazyUpdate: props.lazyUpdate
    })
  } catch (err) {
    console.error('[EChartsWrapper] ❌ setOption 失败:', err)
    error.value = err as Error
    emit('error', error.value)
  }
}

/**
 * 调整大小
 */
function resize() {
  if (!chartInstance || !isChartReady.value) return

  try {
    chartInstance.resize()

    if (typeof chartInstance.getSize === 'function') {
      const { width, height } = chartInstance.getSize()
      emit('resize', { width, height })
    }
  } catch (err) {
    console.warn('[EChartsWrapper] ⚠️ resize 失败:', err)
  }
}

/**
 * 显示加载状态
 */
function showLoading(text?: string) {
  isLoading.value = true
  if (chartInstance) {
    chartInstance.showLoading('default', {
      text: text || props.loadingText,
      color: 'rgba(15, 23, 42, 0.8)',
      textColor: '#94a3b8',
      maskColor: 'rgba(15, 23, 42, 0.3)',
      zlevel: 1,
      fontSize: 14,
      showSpinner: true,
      spinnerRadius: 10,
      lineWidth: 2
    })
  }
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  isLoading.value = false
  if (chartInstance) {
    chartInstance.hideLoading()
  }
}

/**
 * 重试初始化
 */
function retry() {
  error.value = null
  initChart()
}

/**
 * 获取 ECharts 实例
 */
function getInstance(): echarts.ECharts | null {
  return chartInstance
}

/**
 * 清空图表
 */
function clear() {
  if (chartInstance) {
    chartInstance.clear()
  }
}

/**
 * 销毁实例
 */
function dispose() {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
    isChartReady.value = false
  }
}

// ============================================
// 监听器
// ============================================

// 监听 option 变化（浅比较：chartOption 每次返回新对象引用）
watch(() => props.option, (newOption) => {
  if (newOption && chartInstance) {
    setOption(newOption)
  }
}, { deep: false })

// 监听 loading 状态变化
watch(() => props.loading, (newVal) => {
  if (newVal) {
    showLoading()
  } else {
    hideLoading()
  }
})

// ============================================
// 自动 Resize
// ============================================

function setupAutoResize() {
  if (!props.autoResize || !wrapperRef.value) return
  
  let timer: ReturnType<typeof setTimeout> | null = null
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      
      if (timer) clearTimeout(timer)
      
      timer = setTimeout(() => {
        resize()
      }, props.resizeDelay)
    }
  })
  
  resizeObserver.observe(wrapperRef.value)
}

function cleanupAutoResize() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// ============================================
// 生命周期
// ============================================

onMounted(async () => {
  await nextTick()
  initChart()
  setupAutoResize()
})

onUnmounted(() => {
  cleanupAutoResize()
  dispose()
  console.log('[EChartsWrapper] 🧹 组件卸载，资源已清理')
})

// ============================================
// Provide / Inject 支持（供子组件使用）
// ============================================

provide('echartsInstance', () => chartInstance)
provide('echartsResize', resize)

// ============================================
// 暴露给父组件的方法
// ============================================

defineExpose({
  /** 获取 ECharts 实例 */
  getInstance,
  /** 设置配置项 */
  setOption,
  /** 调整大小 */
  resize,
  /** 显示加载 */
  showLoading,
  /** 隐藏加载 */
  hideLoading,
  /** 清空图表 */
  clear,
  /** 销毁实例 */
  dispose,
  /** 重试 */
  retry
})
</script>

<style scoped>
.echarts-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
}

/* ===== 加载状态 ===== */

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(245, 158, 11, 0.2);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 13px;
  color: #94a3b8;
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.12);
}

/* ===== 错误状态 ===== */

.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.95);
  cursor: pointer;
  transition: all var(--duration-200, 200ms);
  z-index: 10;
}

.error-overlay:hover {
  background: rgba(20, 30, 50, 0.95);
}

.error-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.25));
}

.error-message {
  font-size: 14px;
  color: #f87171;
  font-weight: 500;
  max-width: 80%;
  text-align: center;
}

.retry-btn {
  padding: 6px 16px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-200, 200ms);
}

.retry-btn:hover {
  background: rgba(245, 158, 11, 0.25);
  border-color: rgba(245, 158, 11, 0.5);
  transform: scale(1.05);
}

/* ===== 自定义覆盖层 ===== */

.custom-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.custom-overlay > * {
  pointer-events: auto;
}
</style>
