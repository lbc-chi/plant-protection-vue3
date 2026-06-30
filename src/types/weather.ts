export interface WeatherData {
  stationId: string
  stationName: string
  regionId: string
  regionName: string
  longitude: number
  latitude: number
  observationTime: string
  current: CurrentWeather
  forecast?: WeatherForecast[]
  history?: HistoricalWeather[]
}

export interface CurrentWeather {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: WindDirection
  rainfall: number
  visibility: number
  uvIndex: number
  weatherCode: WeatherCode
  weatherDesc: string
  feelsLike: number
  dewPoint: number
  soilTemperature?: number
  soilHumidity?: number
}

export type WindDirection =
  | 'N'
  | 'NNE'
  | 'NE'
  | 'ENE'
  | 'E'
  | 'ESE'
  | 'SE'
  | 'SSE'
  | 'S'
  | 'SSW'
  | 'SW'
  | 'WSW'
  | 'W'
  | 'WNW'
  | 'NW'
  | 'NNW'

export type WeatherCode =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'light_rain'
  | 'moderate_rain'
  | 'heavy_rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'haze'
  | 'dust'

export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: WeatherCode
  weatherDesc: string
  humidity: number
  windSpeed: number
  windDirection: WindDirection
  rainfallProbability: number
  rainfallAmount: number
  uvIndex: number
}

export interface HistoricalWeather {
  date: string
  avgTemp: number
  maxTemp: number
  minTemp: number
  avgHumidity: number
  totalRainfall: number
  avgWindSpeed: number
  dominantWeather: WeatherCode
  sunshineHours: number
}

export interface WeatherStatistics {
  stationId: string
  period: StatisticsPeriod
  startDate: string
  endDate: string
  avgTemperature: number
  maxTemperature: number
  minTemperature: number
  avgHumidity: number
  totalRainfall: number
  rainyDays: number
  avgWindSpeed: number
  extremeWeatherEvents: ExtremeWeatherEvent[]
}

export type StatisticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface ExtremeWeatherEvent {
  date: string
  type: ExtremeWeatherType
  description: string
  impact: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
}

export type ExtremeWeatherType =
  | 'drought'
  | 'flood'
  | 'typhoon'
  | 'heatwave'
  | 'cold_wave'
  | 'hailstorm'
  | 'frost'

export interface WeatherAlert {
  id: string
  type: AlertType
  level: WeatherAlertLevel
  title: string
  content: string
  regionIds: string[]
  effectiveTime: string
  expireTime: string
  issuer: string
  status: 'active' | 'expired' | 'cancelled'
  createdAt: string
}

export type AlertType = 'temperature' | 'rainfall' | 'wind' | 'fog' | 'frost' | 'other'

export type WeatherAlertLevel = 'blue' | 'yellow' | 'orange' | 'red'

export interface AgroMeteorologicalIndex {
  id: string
  name: string
  value: number
  unit: string
  level: 'favorable' | 'normal' | 'unfavorable' | 'severe'
  description: string
  calculationDate: string
  affectingFactors: string[]
}
