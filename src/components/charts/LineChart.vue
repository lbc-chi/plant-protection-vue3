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
import { createLineChartOption } from '../../utils/chart'

interface SeriesData {
  name: string
  data: number[]
  smooth?: boolean
  areaStyle?: boolean
  type?: 'line' | 'bar'
}

interface Props {
  xAxisData: string[]
  series: SeriesData[]
  title?: string
  legend?: boolean
  smooth?: boolean
  areaStyle?: boolean
  loading?: boolean
  error?: string | null
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  xAxisData: () => [],
  series: () => [],
  legend: true,
  smooth: true,
  areaStyle: true,
  loading: false,
  height: '400px'
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'ready', chart: echarts.ECharts): void
}>()

let chartInstance: echarts.ECharts | null = null

const hasValidData = computed(() => {
  const hasXAxis = props.xAxisData && props.xAxisData.length > 0
  const hasValidSeries = (props.series || []).some(
    s => s && s.name && s.type && Array.isArray(s.data) && s.data.length > 0
  )
  return hasXAxis && hasValidSeries
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

  const validSeries = (props.series || []).filter(
    s => s && s.name && s.type && Array.isArray(s.data) && s.data.length > 0
  )

  if (validSeries.length === 0) {
    chartInstance.clear()
    return
  }

  const seriesWithDefaults = validSeries.map(s => ({
    ...s,
    smooth: s.smooth ?? props.smooth,
    areaStyle: s.areaStyle ?? props.areaStyle
  }))

  const option = createLineChartOption({
    xAxisData: props.xAxisData || [],
    series: seriesWithDefaults,
    title: props.title,
    legend: props.legend
  })

  chartInstance.setOption(option, true)
}

watch(
  () => [props.xAxisData, props.series, props.title, props.legend, props.smooth, props.areaStyle],
  () => updateChart(),
  { deep: true }
)

defineExpose({ getInstance: () => chartInstance })
</script>
