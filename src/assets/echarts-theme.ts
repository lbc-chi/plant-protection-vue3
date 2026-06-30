/**
 * ECharts 暗色主题 — 智慧植保指挥平台
 * 深蓝基底 + 生态绿 / 警示橙 / 暖黄 点缀
 */
import * as echarts from '@/utils/echarts'

export function registerEChartsTheme() {
  echarts.registerTheme('plantProtection', {
    color: ['#00d4ff', '#34d399', '#fbbf24', '#f97316', '#60a5fa', '#a78bfa', '#f472b6'],
    backgroundColor: 'transparent',
    textStyle: {},
    title: {
      textStyle: { color: '#e8f4ff', fontSize: 15, fontWeight: 600 },
      subtextStyle: { color: '#5a7a8a' }
    },
    line: {
      itemStyle: { borderWidth: 2 },
      lineStyle: { width: 2 },
      symbolSize: 6,
      symbol: 'circle',
      smooth: true
    },
    radar: {
      itemStyle: { borderWidth: 2 },
      lineStyle: { width: 2 },
      symbolSize: 6,
      symbol: 'circle',
      smooth: true
    },
    bar: {
      itemStyle: {
        barBorderWidth: 0,
        barBorderColor: 'transparent'
      }
    },
    pie: {
      itemStyle: {
        borderWidth: 0,
        borderColor: 'transparent'
      }
    },
    scatter: {
      itemStyle: {
        borderWidth: 0,
        borderColor: 'transparent'
      }
    },
    categoryAxis: {
      axisLine: { show: true, lineStyle: { color: 'rgba(0, 212, 220, 0.15)' } },
      axisTick: { show: false },
      axisLabel: { color: '#5a7a8a', fontSize: 11 },
      splitLine: { show: false }
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5a7a8a', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 220, 0.08)', type: 'dashed' } }
    },
    logAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5a7a8a', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 220, 0.08)', type: 'dashed' } }
    },
    timeAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5a7a8a', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 220, 0.08)', type: 'dashed' } }
    },
    toolbox: {
      iconStyle: { borderColor: '#5a7a8a' },
      emphasis: { iconStyle: { borderColor: '#00d4ff' } }
    },
    legend: {
      textStyle: { color: '#8ecacc', fontSize: 12 },
      pageTextStyle: { color: '#8ecacc' }
    },
    tooltip: {
      axisPointer: {
        lineStyle: { color: 'rgba(0, 212, 220, 0.4)', width: 1 },
        crossStyle: { color: 'rgba(0, 212, 220, 0.4)', width: 1 }
      }
    },
    dataZoom: {
      textStyle: { color: '#5a7a8a' },
      dataBackground: {
        areaStyle: { color: 'rgba(0, 212, 220, 0.08)' },
        lineStyle: { color: 'rgba(0, 212, 220, 0.4)' }
      },
      handleStyle: { color: 'rgba(0, 212, 220, 0.6)' },
      selectedDataBackground: {
        areaStyle: { color: 'rgba(0, 212, 220, 0.15)' },
        lineStyle: { color: 'rgba(0, 212, 220, 0.6)' }
      }
    },
    visualMap: {
      textStyle: { color: '#8ecacc' },
      handleStyle: { color: '#00d4ff' }
    },
    geo: {
      itemStyle: { areaColor: '#0d1f35', borderColor: 'rgba(0, 212, 220, 0.15)' },
      label: { color: '#5a7a8a' },
      emphasis: {
        itemStyle: { areaColor: '#0f2840' },
        label: { color: '#e8f4ff' }
      }
    },
    timeline: {
      lineStyle: { color: 'rgba(0, 212, 220, 0.4)' },
      itemStyle: { color: '#0d1f35', borderColor: 'rgba(0, 212, 220, 0.3)' },
      controlStyle: { color: '#00d4ff', borderColor: 'rgba(0, 212, 220, 0.3)' },
      emphasis: {
        itemStyle: { color: '#0f2840', borderColor: '#00d4ff' },
        controlStyle: { color: '#00d4ff', borderColor: 'rgba(0, 212, 220, 0.5)' }
      }
    },
    gauge: {
      axisLine: { lineStyle: { color: [[0.3, '#34d399'], [0.7, '#fbbf24'], [1, '#ef4444']], width: 8 } },
      axisTick: { length: 8, lineStyle: { color: 'auto' } },
      splitLine: { length: 16, lineStyle: { color: 'auto' } },
      detail: { color: '#e8f4ff', fontSize: 18, fontWeight: 700, fontFamily: 'D-DIN, DIN Alternate, monospace' }
    },
    graph: {
      itemStyle: { borderColor: 'rgba(0, 212, 220, 0.3)' },
      lineStyle: { color: 'rgba(0, 212, 220, 0.3)' },
      symbolSize: 10,
      color: ['#00d4ff', '#34d399', '#fbbf24', '#f97316']
    }
  })
}