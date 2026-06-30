export interface DashboardData {
  overview: OverviewStats
  corridorData: CorridorData[]
  collectionMetrics: CollectionMetrics
  alerts: AlertItem[]
  recentActivities: ActivityItem[]
}

export interface OverviewStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  totalAlerts: number
  todayAlerts: number
  pestDetections: number
  coverageArea: number
  dataCollectionRate: number
}

export interface CorridorData {
  id: string
  name: string
  type: CorridorType
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changeRate: number
  targetValue: number
  completionRate: number
}

export type CorridorType =
  | 'pest_detection'
  | 'device_online'
  | 'data_collection'
  | 'alert_response'
  | 'coverage_rate'

export interface CollectionMetrics {
  totalRecords: number
  todayRecords: number
  successRate: number
  avgResponseTime: number
  metricsByType: MetricItem[]
}

export interface MetricItem {
  type: string
  count: number
  percentage: number
  trend: number
}

export interface AlertItem {
  id: string
  level: AlertLevel
  title: string
  description: string
  source: string
  createTime: string
  status: AlertStatus
  handledBy?: string
  handleTime?: string
}

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical'

export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  user: string
  createTime: string
  metadata?: Record<string, any>
}

export type ActivityType =
  | 'device_alert'
  | 'pest_detected'
  | 'data_sync'
  | 'system_config'
  | 'user_action'

export interface DashboardConfig {
  refreshInterval: number
  displayMode: 'compact' | 'detailed'
  widgets: WidgetConfig[]
}

export interface WidgetConfig {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config?: Record<string, any>
}
