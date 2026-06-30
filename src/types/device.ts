export interface Device {
  id: string
  name: string
  code: string
  type: DeviceType
  model: string
  manufacturer: string
  status: DeviceStatus
  regionId: string
  regionName: string
  stationId: string
  stationName: string
  longitude: number
  latitude: number
  installDate: string
  lastOnlineTime: string
  lastHeartbeatTime?: string
  firmwareVersion: string
  batteryLevel?: number
  signalStrength?: number
  config: DeviceConfig
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export type DeviceType =
  | 'pest_monitoring_lamp'
  | 'sex_pheromone_trap'
  | 'weather_station'
  | 'soil_sensor'
  | 'camera'
  | 'spore_trap'
  | 'light_trap'
  | 'other'

export type DeviceStatus = 'online' | 'offline' | 'fault' | 'maintenance' | 'inactive'

export interface DeviceConfig {
  collectionInterval: number
  uploadInterval: number
  alertThresholds: Record<string, number>
  workingHours: WorkingHours
  autoRestart: boolean
  dataRetentionDays: number
}

export interface WorkingHours {
  enabled: boolean
  startTime: string
  endTime: string
}

export interface PestMonitoringLamp extends Device {
  type: 'pest_monitoring_lamp'
  lampConfig: LampConfig
  currentData?: LampCurrentData
}

export interface LampConfig {
  lightIntensity: number
  wavelength: number
  workingMode: 'auto' | 'manual' | 'schedule'
  killMethod: 'electric' | 'water_drown' | 'poison'
  collectionBoxCapacity: number
  cleaningInterval: number
}

export interface LampCurrentData {
  temperature: number
  humidity: number
  lightStatus: boolean
  insectCount: number
  powerVoltage: number
  runtimeHours: number
}

export interface SexPheromoneTrap extends Device {
  type: 'sex_pheromone_trap'
  trapConfig: TrapConfig
  currentData?: TrapCurrentData
}

export interface TrapConfig {
  targetPestId: string
  pheromoneType: string
  lureValidityDays: number
  trapType: 'bucket' | 'delta' | 'funnel'
  monitoringRadius: number
}

export interface TrapCurrentData {
  capturedCount: number
  lureRemainingDays: number
  trapCondition: 'good' | 'fair' | 'needs_replacement'
  lastMaintenanceDate: string
}

export interface WeatherStation extends Device {
  type: 'weather_station'
  sensorList: SensorInfo[]
  currentData?: WeatherSensorData
}

export interface SensorInfo {
  id: string
  type: SensorType
  name: string
  unit: string
  range: { min: number; max: number }
  accuracy: number
  calibrationDate: string
  nextCalibrationDate: string
}

export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'wind_speed'
  | 'wind_direction'
  | 'rainfall'
  | 'radiation'
  | 'soil_temperature'
  | 'soil_humidity'
  | 'leaf_wetness'

export interface WeatherSensorData {
  [key: string]: SensorReading
}

export interface SensorReading {
  value: number
  unit: string
  quality: 'good' | 'fair' | 'poor'
  timestamp: string
}

export interface DeviceStatistics {
  totalDevices: number
  onlineCount: number
  offlineCount: number
  faultCount: number
  byType: DeviceTypeStats[]
  byRegion: RegionDeviceStats[]
  onlineRate: number
  avgUptime: number
}

export interface DeviceTypeStats {
  type: DeviceType
  typeName: string
  count: number
  onlineCount: number
}

export interface RegionDeviceStats {
  regionId: string
  regionName: string
  totalCount: number
  onlineCount: number
}

export interface DeviceAlert {
  id: string
  deviceId: string
  deviceName: string
  deviceCode: string
  type: AlertType
  level: AlertLevel
  message: string
  value?: number
  threshold?: number
  occurTime: string
  resolvedTime?: string
  status: AlertStatus
  handler?: string
}

export type AlertType =
  | 'offline'
  | 'low_battery'
  | 'sensor_fault'
  | 'data_anomaly'
  | 'communication_error'
  | 'maintenance_due'

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'

export interface DeviceMaintenanceRecord {
  id: string
  deviceId: string
  deviceName: string
  type: MaintenanceType
  description: string
  technician: string
  startTime: string
  endTime?: string
  partsReplaced?: string[]
  result: MaintenanceResult
  remarks?: string
  cost?: number
}

export type MaintenanceType = 'routine' | 'repair' | 'calibration' | 'upgrade' | 'replacement'

export type MaintenanceResult = 'success' | 'partial' | 'failed' | 'pending'
