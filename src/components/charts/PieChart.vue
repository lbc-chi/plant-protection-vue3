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
import { createPieChartOption } from '../../utils/chart'

interface PieDataItem {
  name: string
  value: number
}

interface Props {
  data: PieDataItem[]
  title?: string
  radius?: string | string[]
  roseType?: 'radius' | 'area'
  loading?: boolean
  error?: string | null
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  radius: ['45%', '70%'],
  loading: false,
  height: '400px'
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'ready', chart: echarts.ECharts): void
}>()

let chartInstance: echarts.ECharts | null = null

const hasValidData = computed(() => {
  return (props.data || []).some(
    item => item && item.name && item.value !== undefined && !isNaN(item.value)
  )
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

  const validData = (props.data || []).filter(
    item => item && item.name && item.value !== undefined && !isNaN(item.value)
  )

  if (validData.length === 0) {
    chartInstance.clear()
    return
  }

  const option = createPieChartOption({
    data: validData,
    title: props.title,
    radius: props.radius,
    roseType: props.roseType
  })

  chartInstance.setOption(option, true)
}

watch(
  () => [props.data, props.title, props.radius, props.roseType],
  () => updateChart(),
  { deep: true }
)

defineExpose({ getInstance: () => chartInstance })
</script>
