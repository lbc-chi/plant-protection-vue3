export interface ProjectOverview {
  id: string
  name: string
  code: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate?: string
  progress: number
  budget: number
  spent: number
  manager: string
  contactPhone: string
  contactEmail: string
  address: string
  coverageArea: ProjectCoverageInfo
  statistics: ProjectStatistics
  milestones: Milestone[]
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

export interface ProjectCoverageInfo {
  totalArea: number
  unit: string
  provinces: number
  cities: number
  counties: number
  coveredRegions: CoveredRegion[]
}

export interface CoveredRegion {
  regionId: string
  regionName: string
  area: number
  stationCount: number
  deviceCount: number
  coverageRate: number
}

export interface ProjectStatistics {
  totalStations: number
  totalDevices: number
  onlineDevices: number
  dataPointsToday: number
  alertsToday: number
  pestDetectionsThisMonth: number
  avgResponseTime: number
  systemUptime: number
}

export interface Milestone {
  id: string
  name: string
  description: string
  plannedDate: string
  actualDate?: string
  status: MilestoneStatus
  progress: number
  deliverables: string[]
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'

export interface Station {
  id: string
  name: string
  code: string
  type: StationType
  status: StationStatus
  regionId: string
  regionName: string
  address: string
  longitude: number
  latitude: number
  altitude: number
  area: number
  responsiblePerson: string
  phone: string
  installDate: string
  devices: DeviceSummary[]
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export type StationType = 'monitoring' | 'control' | 'observation' | 'comprehensive'

export type StationStatus = 'operational' | 'under_construction' | 'maintenance' | 'inactive'

export interface DeviceSummary {
  deviceId: string
  deviceName: string
  deviceType: string
  status: string
  installDate: string
}

export interface StationStatistics {
  stationId: string
  stationName: string
  deviceCount: number
  onlineDeviceCount: number
  dataCollectionRate: number
  alertCount: number
  pestDetectionCount: number
  uptimePercentage: number
  monthlyData: MonthlyStationData[]
}

export interface MonthlyStationData {
  month: string
  year: number
  dataCollected: number
  alertsGenerated: number
  pestsDetected: number
  uptimeHours: number
}

export interface ProjectTimeline {
  events: TimelineEvent[]
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  type: EventType
  importance: 'low' | 'medium' | 'high'
  attachments?: Attachment[]
}

export type EventType =
  | 'milestone'
  | 'device_installation'
  | 'system_upgrade'
  | 'alert_event'
  | 'maintenance'
  | 'inspection'
  | 'other'

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'video'
  size: number
  uploadTime: string
}
