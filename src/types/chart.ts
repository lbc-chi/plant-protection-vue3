export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'map' | 'heatmap'

export interface ChartConfig {
  id: string
  type: ChartType
  title: string
  width?: number
  height?: number
  theme?: ChartTheme
  options: EChartsOption
}

export type ChartTheme = 'default' | 'dark' | 'custom'

export interface EChartsOption {
  title?: TitleOption
  tooltip?: TooltipOption
  legend?: LegendOption
  grid?: GridOption
  xAxis?: AxisOption[]
  yAxis?: AxisOption[]
  series: SeriesOption[]
  color?: string[]
  toolbox?: ToolboxOption
  dataZoom?: DataZoomOption[]
}

export interface TitleOption {
  text: string
  subtext?: string
  left?: string | number
  top?: string | number
  textStyle?: TextStyle
  subtextStyle?: TextStyle
}

export interface TextStyle {
  color?: string
  fontStyle?: 'normal' | 'italic' | 'oblique'
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter'
  fontSize?: number | string
}

export interface TooltipOption {
  trigger?: 'axis' | 'item'
  axisPointer?: AxisPointerOption
  formatter?: string | ((params: any) => string)
}

export interface AxisPointerOption {
  type?: 'line' | 'shadow' | 'cross'
}

export interface LegendOption {
  data: string[]
  top?: string | number
  left?: string | number
  orient?: 'horizontal' | 'vertical'
}

export interface GridOption {
  left?: string | number
  right?: string | number
  top?: string | number
  bottom?: string | number
  containLabel?: boolean
}

export interface AxisOption {
  type?: 'category' | 'value' | 'time' | 'log'
  data?: string[] | number[]
  name?: string
  boundaryGap?: boolean
  axisLabel?: AxisLabelOption
  splitLine?: SplitLineOption
}

export interface AxisLabelOption {
  rotate?: number
  formatter?: string | ((value: any) => string)
  interval?: number | 'auto'
}

export interface SplitLineOption {
  show?: boolean
  lineStyle?: LineStyle
}

export interface LineStyle {
  color?: string
  width?: number
  type?: 'solid' | 'dashed' | 'dotted'
}

export type SeriesOption = LineSeriesOption | BarSeriesOption | PieSeriesOption | ScatterSeriesOption

export interface BaseSeriesOption {
  name: string
  type: ChartType
  data: any[]
  smooth?: boolean
  symbol?: string
  symbolSize?: number | number[]
  itemStyle?: ItemStyleOption
  label?: LabelOption
}

export interface LineSeriesOption extends BaseSeriesOption {
  type: 'line'
  areaStyle?: AreaStyleOption
  stack?: string
}

export interface BarSeriesOption extends BaseSeriesOption {
  type: 'bar'
  barWidth?: string | number
  stack?: string
  itemStyle?: BarItemStyleOption
}

export interface PieSeriesOption extends BaseSeriesOption {
  type: 'pie'
  radius?: string | string[]
  center?: [string, string]
  roseType?: 'radius' | 'area'
  label?: PieLabelOption
}

export interface ScatterSeriesOption extends BaseSeriesOption {
  type: 'scatter'
  symbolSize?: number | ((data: any[]) => number)
}

export interface ItemStyleOption {
  color?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
}

export interface BarItemStyleOption extends ItemStyleOption {
  borderRadius?: number | number[]
}

export interface AreaStyleOption {
  color?: string
  origin?: 'auto' | 'start' | 'end'
  opacity?: number
}

export interface LabelOption {
  show?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom' | 'inside' | 'insideLeft' | 'insideRight'
  formatter?: string | ((params: any) => string)
  fontSize?: number
  color?: string
}

export interface PieLabelOption extends LabelOption {
  formatter?: string | ((params: any) => string)
}

export interface ToolboxOption {
  feature?: {
    saveAsImage?: {}
    restore?: {}
    dataView?: {}
    magicType?: { type: string[] }
  }
}

export interface DataZoomOption {
  type?: 'slider' | 'inside'
  start?: number
  end?: number
}

export interface ChartDataPoint {
  name: string
  value: number
  category?: string
  timestamp?: string
  metadata?: Record<string, any>
}

export interface TimeSeriesData {
  timestamps: string[]
  values: number[]
  label: string
}
