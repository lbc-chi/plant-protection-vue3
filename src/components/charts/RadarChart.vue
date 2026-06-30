<template>
  <ChartContainer
    :loading="loading"
    :error="error"
    :width="width"
    :height="height"
    @ready="handleReady"
    @retry="$emit('retry')"
  >
    <template v-if="$slots.header" #header>
      <slot name="header"></slot>
    </template>
  </ChartContainer>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue'
import * as echarts from '@/utils/echarts'
import ChartContainer from './ChartContainer.vue'
import { createRadarOption } from '../../utils/chart'

interface Indicator {
  name: string
  max: number
}

interface SeriesData {
  name: string
  type: 'radar'
  data: number[]
}

interface Props {
  indicators: Indicator[]
  series: SeriesData[]
  title?: string
  loading?: boolean
  error?: string | null
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  indicators: () => [],
  series: () => [],
  loading: false,
  height: '400px'
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'ready', chart: echarts.ECharts): void
}>()

let chartInstance: echarts.ECharts | null = null

const hasValidData = computed(() => {
  const hasValidIndicators = (props.indicators || []).some(
    indicator => indicator && indicator.name && indicator.max !== undefined
  )
  const hasValidSeries = (props.series || []).some(
    s => s && s.name && s.type && Array.isArray(s.data) && s.data.length > 0
  )
  return hasValidIndicators && hasValidSeries
})

function handleReady(chart: echarts.ECharts) {
  chartInstance = chart
  updateChart()
  emit('ready', chart)
}

function updateChart() {
  if (!chartInstance) return

  if (!hasValidData.value) {
    chartInstance.clear()
    return
  }

  const validIndicators = (props.indicators || []).filter(
    indicator => indicator && indicator.name && indicator.max !== undefined
  )

  const validSeries = (props.series || []).filter(
    s => s && s.name && s.type && Array.isArray(s.data) && s.data.length > 0
  )

  if (validIndicators.length === 0 || validSeries.length === 0) {
    chartInstance.clear()
    return
  }

  const option = createRadarOption({
    indicators: validIndicators,
    series: validSeries,
    title: props.title
  })

  chartInstance.setOption(option, true)
}

watch(
  () => [props.indicators, props.series, props.title],
  () => updateChart(),
  { deep: true }
)

defineExpose({ getInstance: () => chartInstance })
</script>
