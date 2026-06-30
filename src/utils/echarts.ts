/**
 * ECharts 按需引入统一模块
 * 替代 `import * as echarts from 'echarts'`，减少 ~40% 包体积
 */
import * as echarts from 'echarts/core'

// ===== 图表类型 =====
import { MapChart } from 'echarts/charts'
import { ScatterChart } from 'echarts/charts'
import { EffectScatterChart } from 'echarts/charts'
import { HeatmapChart } from 'echarts/charts'
import { LineChart } from 'echarts/charts'
import { BarChart } from 'echarts/charts'
import { PieChart } from 'echarts/charts'
import { RadarChart } from 'echarts/charts'
import { GaugeChart } from 'echarts/charts'

// ===== 组件 =====
import { TitleComponent } from 'echarts/components'
import { TooltipComponent } from 'echarts/components'
import { LegendComponent } from 'echarts/components'
import { GridComponent } from 'echarts/components'
import { GeoComponent } from 'echarts/components'
import { VisualMapComponent } from 'echarts/components'
import { MarkLineComponent } from 'echarts/components'
import { MarkPointComponent } from 'echarts/components'
import { ToolboxComponent } from 'echarts/components'
import { DataZoomComponent } from 'echarts/components'
import { TimelineComponent } from 'echarts/components'

// ===== 渲染器 =====
import { CanvasRenderer } from 'echarts/renderers'

// ===== 一次性注册 =====
echarts.use([
  // 图表
  MapChart, ScatterChart, EffectScatterChart, HeatmapChart,
  LineChart, BarChart, PieChart, RadarChart, GaugeChart,
  // 组件
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  GeoComponent, VisualMapComponent, MarkLineComponent, MarkPointComponent,
  ToolboxComponent, DataZoomComponent, TimelineComponent,
  // 渲染器
  CanvasRenderer
])

export default echarts
export * from 'echarts/core'
