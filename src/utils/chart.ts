import * as echarts from '@/utils/echarts'

export const CHART_COLORS = {
  primary: '#ff8c00',
  success: '#00d4aa',
  warning: '#ff8c00',
  danger: '#ff4757',
  info: '#00bcd4',
  blue: ['#00bcd4', '#33c9dc', '#66d7e6', '#99e4ef', '#ccf2f7'],
  green: ['#00d4aa', '#33e0bf', '#66ebd3', '#99f4e5', '#ccfaf3'],
  orange: ['#ff8c00', '#ffb84d', '#ffc87f', '#ffd8b2', '#ffe8cc'],
  red: ['#ff4757', '#ff6b78', '#ff8f99', '#ffb3bb', '#ffd7dd'],
  purple: ['#a855f7', '#bb77f9', '#ce99fb', '#e1bbfd', '#f4ddfe'],
  gradient: ['#ff8c00', '#ffb84d', '#00bcd4', '#00d4aa', '#a855f7', '#ffd700']
}

export function getChartThemeColors(): string[] {
  return CHART_COLORS.gradient
}

export function createBaseOption(): echarts.EChartsOption {
  return {
    color: getChartThemeColors(),
    backgroundColor: 'transparent',
    textStyle: {
      color: '#8892a6'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: 'rgba(10, 22, 40, 0.92)',
      borderColor: 'rgba(255, 140, 0, 0.3)',
      borderWidth: 1,
      textStyle: {
        color: '#e5eaf3'
      }
    },
    legend: {
      textStyle: {
        color: '#8892a6'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }
}

export function createLineChartOption(config: {
  xAxisData: string[]
  series: Array<{
    name: string
    data: number[]
    smooth?: boolean
    areaStyle?: boolean
    type?: 'line' | 'bar'
  }>
  title?: string
  legend?: boolean
}): echarts.EChartsOption {
  const option = createBaseOption()

  return {
    ...option,
    title: config.title ? {
      text: config.title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#e5eaf3'
      }
    } : undefined,
    legend: config.legend !== false ? {
      top: 30,
      textStyle: {
        color: '#8892a6'
      }
    } : undefined,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: config.xAxisData,
      axisLine: {
        lineStyle: { color: 'rgba(255, 140, 0, 0.2)' }
      },
      axisLabel: {
        color: '#8892a6'
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 140, 0, 0.08)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#8892a6'
      }
    },
    series: config.series.map((s, index) => ({
      name: s.name,
      type: s.type || 'line',
      data: s.data,
      smooth: s.smooth ?? true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: s.areaStyle ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length] + '40' },
          { offset: 1, color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length] + '05' }
        ])
      } : undefined,
      lineStyle: {
        width: 2
      }
    }))
  }
}

export function createBarChartOption(config: {
  xAxisData: string[]
  series: Array<{
    name: string
    data: number[]
    stack?: string
  }>
  title?: string
  horizontal?: boolean
  stacked?: boolean
}): echarts.EChartsOption {
  const option = createBaseOption()

  const isHorizontal = config.horizontal

  return {
    ...option,
    title: config.title ? {
      text: config.title,
      left: 'center'
    } : undefined,
    xAxis: {
      type: isHorizontal ? 'value' : 'category',
      data: isHorizontal ? undefined : config.xAxisData,
      axisLabel: { color: '#8892a6' }
    },
    yAxis: {
      type: isHorizontal ? 'category' : 'value',
      data: isHorizontal ? config.xAxisData : undefined,
      axisLabel: { color: '#8892a6' },
      splitLine: !isHorizontal ? {
        lineStyle: { color: 'rgba(255, 140, 0, 0.08)', type: 'dashed' as const }
      } : undefined
    },
    series: config.series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      stack: config.stacked ? 'total' : s.stack,
      barWidth: config.stacked ? undefined : '20%',
      itemStyle: {
        borderRadius: config.stacked ? [0, 0, 0, 0] : [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(
          isHorizontal ? 0 : 0,
          isHorizontal ? 0 : 1,
          isHorizontal ? 1 : 0,
          isHorizontal ? 1 : 0,
          [
            { offset: 0, color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length] },
            { offset: 1, color: CHART_COLORS.gradient[(index + 1) % CHART_COLORS.gradient.length] + '80' }
          ]
        )
      }
    }))
  }
}

export function createPieChartOption(config: {
  data: Array<{ name: string; value: number }>
  title?: string
  radius?: string | string[]
  roseType?: 'radius' | 'area'
}): echarts.EChartsOption {
  return {
    ...createBaseOption(),
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    title: config.title ? {
      text: config.title,
      left: 'center'
    } : undefined,
    series: [{
      type: 'pie',
      radius: config.radius || ['45%', '70%'],
      center: ['50%', '55%'],
      roseType: config.roseType,
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: 'rgba(10, 22, 40, 0.8)',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        fontSize: 12
      },
      labelLine: {
        length: 15,
        length2: 10
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      },
      data: config.data
    }]
  }
}

export function createGaugeOption(config: {
  value: number
  min?: number
  max?: number
  title?: string
  unit?: string
  colors?: Array<{ offset: number; color: string }>
}): echarts.EChartsOption {
  const { value, min = 0, max = 100, title, unit = '%', colors } = config

  const defaultColors = colors || [
    { offset: 0, color: '#F56C6C' },
    { offset: 0.5, color: '#E6A23C' },
    { offset: 1, color: '#67C23A' }
  ]

  return {
    ...createBaseOption(),
    series: [{
      type: 'gauge',
      min,
      max,
      startAngle: 200,
      endAngle: -20,
      radius: '90%',
      center: ['50%', '60%'],
      progress: {
        show: true,
        width: 18
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: defaultColors.map(c => [c.offset, c.color])
        }
      },
      axisTick: {
        distance: -20,
        length: 6,
        lineStyle: {
          width: 1,
          color: '#8892a6'
        }
      },
      splitLine: {
        distance: -24,
        length: 10,
        lineStyle: {
          width: 2,
          color: '#8892a6'
        }
      },
      axisLabel: {
        distance: -35,
        color: '#8892a6',
        fontSize: 11
      },
      anchor: {
        show: true,
        size: 16,
        itemStyle: {
          borderColor: 'rgba(10, 22, 40, 0.9)',
          borderWidth: 2
        }
      },
      title: {
        show: true,
        offsetCenter: [0, '70%'],
        fontSize: 13,
        color: '#8892a6'
      },
      detail: {
        valueAnimation: true,
        fontSize: 28,
        fontWeight: 'bolder',
        formatter: `{value}${unit}`,
        color: 'inherit',
        offsetCenter: [0, '10%']
      },
      data: [{
        value,
        title: title || ''
      }]
    }]
  }
}

export function createRadarOption(config: {
  indicators: Array<{ name: string; max: number }>
  series: Array<{
    name: string
    data: number[]
  }>
  title?: string
}): echarts.EChartsOption {
  return {
    ...createBaseOption(),
    tooltip: {},
    title: config.title ? {
      text: config.title,
      left: 'center'
    } : undefined,
    legend: {
      bottom: 0,
      textStyle: { color: '#8892a6' }
    },
    radar: {
      indicator: config.indicators,
      shape: 'polygon',
      center: ['50%', '48%'],
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#8892a6',
        fontSize: 12
      },
      splitLine: {
        lineStyle: { color: 'rgba(255, 140, 0, 0.15)' }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 140, 0, 0.02)', 'rgba(255, 140, 0, 0.04)']
        }
      },
      axisLine: {
        lineStyle: { color: 'rgba(255, 140, 0, 0.15)' }
      }
    },
    series: [{
      type: 'radar',
      data: config.series.map((s, index) => ({
        name: s.name,
        value: s.data,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length]
        },
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length] + '40' },
            { offset: 1, color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length] + '05' }
          ])
        },
        itemStyle: {
          color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length]
        }
      }))
    }]
  }
}

export function resizeChart(chart: echarts.ECharts | null): void {
  if (chart) {
    chart.resize()
  }
}

export function debounceResize(chart: echarts.ECharts | null, delay: number = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      resizeChart(chart)
      timer = null
    }, delay)
  }
}
