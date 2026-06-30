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
import { createGaugeOption } from '../../utils/chart'

interface Props {
  value: number
  min?: number
  max?: number
  title?: string
  unit?: string
  colors?: Array<{ offset: number; color: string }>
  loading?: boolean
  error?: string | null
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  unit: '%',
  colors: () => [],
  loading: false,
  height: '280px'
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'ready', chart: echarts.ECharts): void
}>()

let chartInstance: echarts.ECharts | null = null

const hasValidData = computed(() => {
  return props.value !== undefined && props.value !== null && !isNaN(props.value)
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

  const validColors = (props.colors || []).filter(
    color => color && color.offset !== undefined && color.color
  )

  const option = createGaugeOption({
    value: props.value,
    min: props.min,
    max: props.max,
    title: props.title || '',
    unit: props.unit,
    colors: validColors.length > 0 ? validColors : undefined
  })

  chartInstance.setOption(option, true)
}

watch(
  () => [props.value, props.min, props.max, props.title, props.unit],
  () => updateChart(),
  { deep: true }
)

defineExpose({ getInstance: () => chartInstance })
</script>
