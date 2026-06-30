export interface PestInfo {
  id: string
  name: string
  scientificName: string
  category: PestCategory
  dangerLevel: DangerLevel
  description: string
  image?: string
  hostPlants: string[]
  occurrencePeriod: string
  preventionMethods: string[]
  economicThreshold?: number
  createdAt: string
  updatedAt: string
}

export type PestCategory =
  | 'lepidoptera'
  | 'coleoptera'
  | 'hemiptera'
  | 'diptera'
  | 'hymenoptera'
  | 'orthoptera'
  | 'other'

export type DangerLevel = 'low' | 'medium' | 'high' | 'critical'

export interface PestDetection {
  id: string
  pestId: string
  pestName: string
  deviceId: string
  deviceName: string
  regionId: string
  regionName: string
  count: number
  density: number
  unit: string
  detectionTime: string
  imageUrl?: string
  confidence: number
  status: DetectionStatus
  handler?: string
  handleTime?: string
  handleMethod?: string
  remarks?: string
}

export type DetectionStatus = 'pending' | 'confirmed' | 'false_alarm' | 'handled'

export interface PestMonitorRecord {
  id: string
  pestId: string
  regionId: string
  stationId: string
  date: string
  adultCount: number
  larvaCount: number
  eggCount: number
  pupaCount: number
  totalDensity: number
  weatherCondition: WeatherCondition
  cropType: string
  growthStage: string
  damageLevel: DamageLevel
  trend: PestTrend
  prediction?: PestPrediction
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'overcast' | 'foggy'

export type DamageLevel = 'none' | 'light' | 'moderate' | 'severe'

export type PestTrend = 'rising' | 'stable' | 'declining' | 'unknown'

export interface PestPrediction {
  predictedDate: string
  predictedDensity: number
  confidence: number
  riskLevel: DangerLevel
  suggestions: string[]
}

export interface PestStatistics {
  pestId: string
  pestName: string
  totalDetections: number
  avgDensity: number
  maxDensity: number
  affectedArea: number
  trend: PestTrend
  monthlyData: MonthlyPestData[]
}

export interface MonthlyPestData {
  month: string
  count: number
  density: number
  yearOverYear: number
}

export interface PestAlertRule {
  id: string
  pestId: string
  threshold: number
  unit: string
  condition: 'greater_than' | 'less_than' | 'equal'
  alertLevel: DangerLevel
  notifyChannels: NotifyChannel[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type NotifyChannel = 'sms' | 'email' | 'app_push' | 'wechat' | 'phone'
