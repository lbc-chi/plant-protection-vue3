/**
 * 虫害密度等级 — 统一阈值、颜色、标签定义
 *
 * 等级划分（基于当前城市最大值占比 ratio）：
 *   高     ratio >= 0.8
 *   中高   0.6 <= ratio < 0.8
 *   中     0.4 <= ratio < 0.6
 *   低     ratio < 0.4
 */

export interface PestColorConfig {
  color: string       // 基础色（低）
  colorHigh: string   // 高亮色（高）
  colorMid?: string   // 中间色（中高），默认自动生成
}

export interface DensityLevel {
  key: 'high' | 'midHigh' | 'mid' | 'low'
  label: string
  threshold: number
}

/** 统一的 4 级密度等级定义 */
export const DENSITY_LEVELS: DensityLevel[] = [
  { key: 'high',    label: '高',   threshold: 0.8 },
  { key: 'midHigh', label: '中高', threshold: 0.6 },
  { key: 'mid',     label: '中',   threshold: 0.4 },
  { key: 'low',     label: '低',   threshold: 0 },
]

/**
 * 根据数值和最大值计算密度等级
 */
export function getDensityLevel(value: number, maxVal: number): DensityLevel {
  if (maxVal === 0) return DENSITY_LEVELS[3] // low
  const ratio = value / maxVal
  for (const level of DENSITY_LEVELS) {
    if (ratio >= level.threshold) return level
  }
  return DENSITY_LEVELS[3]
}

/**
 * 根据密度等级获取气泡颜色
 */
export function getLevelColor(config: PestColorConfig, value: number, maxVal: number): string {
  const level = getDensityLevel(value, maxVal)
  switch (level.key) {
    case 'high':
      return config.colorHigh
    case 'midHigh':
      return config.colorMid || '#f97316'
    case 'mid':
      return '#eab308'
    case 'low':
    default:
      return config.color
  }
}

/**
 * 根据配置生成图例渐变色（用于 CSS gradient）
 */
export function getLegendGradient(config: PestColorConfig): string {
  const high = config.colorHigh
  const midHigh = config.colorMid || '#f97316'
  const mid = '#eab308'
  const low = config.color
  return `linear-gradient(90deg, ${low}, ${mid}, ${midHigh}, ${high})`
}

/**
 * 生成图例项（用于 DOM 渲染图例）
 */
export interface LegendItem {
  label: string
  color: string
}

export function getLegendItems(config: PestColorConfig): LegendItem[] {
  return [
    { label: '高',   color: config.colorHigh },
    { label: '中高', color: config.colorMid || '#f97316' },
    { label: '中',   color: '#eab308' },
    { label: '低',   color: config.color },
  ]
}