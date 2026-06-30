/**
 * mockData.ts — 智慧植保指挥平台 标准化 Mock 数据
 *
 * 单一数据源（Single Source of Truth），所有组件统一引用。
 * 数据基于山东省真实地理特征和植保业务逻辑生成。
 */

// ============================================================
// 一、城市基础数据（16 地市）
// ============================================================

export interface CityBaseInfo {
  /** 城市名称 */
  name: string
  /** 经纬度 [lng, lat] */
  coord: [number, number]
  /** 监测值（虫害密度基准，用于热力图/散点图/填色图） */
  monitorValue: number
  /** 排名（按监测值降序） */
  rank: number
  /** 站点数量 */
  stations: number
  /** 设备数量 */
  devices: number
  /** 离线设备数 */
  offlineDevices: number
  /** 灯诱设备数 */
  lightTraps: number
  /** 性诱设备数 */
  sexLures: number
  /** 生境监测点数 */
  habitats: number
  /** 发生面积（万亩） */
  occurrenceArea: number
  /** 防治面积（万亩） */
  preventionArea: number
  /** 危险等级 1-5 */
  hazardLevel: number
}

/** 山东省 16 地市标准化数据 */
export const CITIES: CityBaseInfo[] = [
  { name: '济南市',   coord: [117.00, 36.65], monitorValue: 2283, rank: 1,  stations: 8,  devices: 42, offlineDevices: 3,  lightTraps: 18, sexLures: 12, habitats: 5,  occurrenceArea: 125.6, preventionArea: 118.3, hazardLevel: 4 },
  { name: '青岛市',   coord: [120.38, 36.07], monitorValue: 2156, rank: 2,  stations: 7,  devices: 38, offlineDevices: 2,  lightTraps: 16, sexLures: 11, habitats: 4,  occurrenceArea: 156.8, preventionArea: 148.5, hazardLevel: 4 },
  { name: '潍坊市',   coord: [119.12, 36.71], monitorValue: 1987, rank: 3,  stations: 6,  devices: 35, offlineDevices: 4,  lightTraps: 15, sexLures: 10, habitats: 4,  occurrenceArea: 178.4, preventionArea: 169.2, hazardLevel: 5 },
  { name: '临沂市',   coord: [118.35, 35.05], monitorValue: 1823, rank: 4,  stations: 6,  devices: 32, offlineDevices: 3,  lightTraps: 14, sexLures: 9,  habitats: 3,  occurrenceArea: 145.2, preventionArea: 138.6, hazardLevel: 4 },
  { name: '烟台市',   coord: [121.39, 37.54], monitorValue: 1698, rank: 5,  stations: 5,  devices: 28, offlineDevices: 2,  lightTraps: 12, sexLures: 8,  habitats: 3,  occurrenceArea: 98.5,  preventionArea: 94.2,  hazardLevel: 3 },
  { name: '菏泽市',   coord: [115.47, 35.24], monitorValue: 1545, rank: 6,  stations: 5,  devices: 26, offlineDevices: 5,  lightTraps: 11, sexLures: 8, habitats: 3,  occurrenceArea: 168.3, preventionArea: 159.8, hazardLevel: 5 },
  { name: '德州市',   coord: [116.30, 37.45], monitorValue: 1423, rank: 7,  stations: 4,  devices: 24, offlineDevices: 4,  lightTraps: 10, sexLures: 7, habitats: 2,  occurrenceArea: 135.7, preventionArea: 128.9, hazardLevel: 4 },
  { name: '济宁市',   coord: [116.59, 35.41], monitorValue: 1298, rank: 8,  stations: 4,  devices: 22, offlineDevices: 3,  lightTraps: 9,  sexLures: 6, habitats: 2,  occurrenceArea: 112.4, preventionArea: 106.8, hazardLevel: 3 },
  { name: '淄博市',   coord: [118.05, 36.81], monitorValue: 1156, rank: 9,  stations: 4,  devices: 20, offlineDevices: 2,  lightTraps: 8,  sexLures: 6, habitats: 2,  occurrenceArea: 78.6,  preventionArea: 74.7,  hazardLevel: 3 },
  { name: '滨州市',   coord: [118.02, 37.38], monitorValue: 1089, rank: 10, stations: 3,  devices: 18, offlineDevices: 3,  lightTraps: 8,  sexLures: 5, habitats: 2,  occurrenceArea: 88.3,  preventionArea: 83.9,  hazardLevel: 3 },
  { name: '聊城市',   coord: [115.98, 36.45], monitorValue: 967,  rank: 11, stations: 3,  devices: 16, offlineDevices: 4,  lightTraps: 7,  sexLures: 5, habitats: 1,  occurrenceArea: 102.5, preventionArea: 97.4,  hazardLevel: 4 },
  { name: '泰安市',   coord: [117.13, 36.19], monitorValue: 856,  rank: 12, stations: 3,  devices: 15, offlineDevices: 2,  lightTraps: 6,  sexLures: 4, habitats: 2,  occurrenceArea: 65.8,  preventionArea: 62.5, hazardLevel: 2 },
  { name: '威海市',   coord: [122.12, 37.51], monitorValue: 754,  rank: 13, stations: 3,  devices: 14, offlineDevices: 1,  lightTraps: 6,  sexLures: 4, habitats: 1,  occurrenceArea: 45.2, preventionArea: 42.9, hazardLevel: 2 },
  { name: '枣庄市',   coord: [117.32, 34.82], monitorValue: 682,  rank: 14, stations: 2,  devices: 12, offlineDevices: 2,  lightTraps: 5,  sexLures: 3, habitats: 1,  occurrenceArea: 55.7, preventionArea: 52.9, hazardLevel: 2 },
  { name: '东营市',   coord: [118.49, 37.46], monitorValue: 623,  rank: 15, stations: 2,  devices: 10, offlineDevices: 3,  lightTraps: 4,  sexLures: 3, habitats: 1,  occurrenceArea: 72.1, preventionArea: 68.5, hazardLevel: 3 },
  { name: '日照市',   coord: [119.46, 35.42], monitorValue: 548,  rank: 16, stations: 2,  devices: 10, offlineDevices: 2,  lightTraps: 4,  sexLures: 3, habitats: 1,  occurrenceArea: 38.4, preventionArea: 36.5, hazardLevel: 2 },
]

/** 城市名称列表（用于轮播等） */
export const CITY_NAMES = CITIES.map(c => c.name)

/** 城市坐标映射表 Record<cityName, [lng, lat]> */
export const CITY_COORDS: Record<string, [number, number]> = Object.fromEntries(
  CITIES.map(c => [c.name, c.coord])
)

/** 城市名 → 城市数据 映射 */
export const CITY_MAP: Record<string, CityBaseInfo> = Object.fromEntries(
  CITIES.map(c => [c.name, c])
)


// ============================================================
// 二、植保工程建设成果（右侧面板 6 个仪表卡片）
// ============================================================

export interface ConstructionStat {
  /** key（与 RightPanelPrototype gaugeCards 对应） */
  key: string
  /** 显示标签 */
  label: string
  /** 数值 */
  value: number
  /** 趋势值（正=增长，负=下降） */
  trend: number
  /** 图标 emoji */
  icon: string
  /** 圆环颜色（外圈描边色） */
  ringColor: string
  /** 圆环内圈填充色 */
  ringBg: string
}

/** 植保工程建设成果 6 项统计数据 */
export const CONSTRUCTION_STATS: ConstructionStat[] = [
  { key: 'stations', label: '站点', value: 52,  trend: 5.2,  icon: '🌐',  ringColor: '#0ea5e9', ringBg: 'rgba(14,165,233,0.15)' },
  { key: 'devices',  label: '设备', value: 12,  trend: -2.1, icon: '📋',  ringColor: '#a78bfa', ringBg: 'rgba(167,139,250,0.15)' },
  { key: 'offline',  label: '离线', value: 71,  trend: 3.8,  icon: '📡',  ringColor: '#f97316', ringBg: 'rgba(249,115,22,0.15)' },
  { key: 'lights',   label: '灯诱', value: 11,  trend: 7.8,  icon: '💡',  ringColor: '#facc15', ringBg: 'rgba(250,204,21,0.15)' },
  { key: 'sexLure',  label: '性诱', value: 31,  trend: 12.3,icon: '🔬', ringColor: '#ec4899', ringBg: 'rgba(236,72,153,0.15)' },
  { key: 'habitat', label: '生境', value: 12,  trend: 4.5, icon: '☀️',  ringColor: '#f97316', ringBg: 'rgba(249,115,22,0.15)' },
]

/** 各项总计（用于一致性校验） */
export const CONSTRUCTION_TOTALS = {
  stations: CITIES.reduce((s, c) => s + c.stations, 0),     // 70 → 显示用 52（覆盖范围）
  devices: CITIES.reduce((s, c) => s + c.devices, 0),       // 392 → 显示用 12（在线核心）
  offlineDevices: CITIES.reduce((s, c) => s + c.offlineDevices, 0),
  lightTraps: CITIES.reduce((s, c) => s + c.lightTraps, 0),
  sexLures: CITIES.reduce((s, c) => s + c.sexLures, 0),
  habitats: CITIES.reduce((s, c) => s + c.habitats, 0),
}


// ============================================================
// 三、虫害密度数据（按虫种 × 城市）
// ============================================================

export interface PestDensityConfig {
  /** 虫种 key */
  key: string
  /** 虫种显示名 */
  name: string
  /** 地图显示 key */
  mapKey: string
  /** 基准系数（影响数值大小） */
  baseMultiplier: number
  /** 活跃城市列表 */
  activeCities: string[]
  /** 颜色配置 */
  color: string
  colorHigh: string
  colorMid: string
}

/** 虫种配置 */
export const PEST_TYPES: PestDensityConfig[] = [
  {
    key: 'liangmianchong', name: '棉铃虫', mapKey: 'mian',
    baseMultiplier: 1.0,
    activeCities: CITY_NAMES, // 全省普遍发生
    color: '#f59e0b', colorHigh: '#ef4444', colorMid: '#f97316',
  },
  {
    key: 'yumisong', name: '玉米螟', mapKey: 'yum',
    baseMultiplier: 0.75,
    activeCities: ['济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','临沂市','德州市','聊城市','滨州市','菏泽市'],
    color: '#10b981', colorHigh: '#22c55e', colorMid: '#34d399',
  },
  {
    key: 'huangchong', name: '蝗虫', mapKey: 'huang',
    baseMultiplier: 0.45,
    activeCities: ['东营市','滨州市','德州市','聊城市','菏泽市','济宁市','潍坊市'],
    color: '#3b82f6', colorHigh: '#60a5fa', colorMid: '#93c5fd',
  },
]

/** 月份系数：模拟虫害季节性规律 */
export const MONTH_MULTIPLIERS: Record<number, { valueMult: number; activeRatio: number }> = {
  1:  { valueMult: 0.15, activeRatio: 0.35 },
  2:  { valueMult: 0.25, activeRatio: 0.45 },
  3:  { valueMult: 0.50, activeRatio: 0.65 },
  4:  { valueMult: 0.75, activeRatio: 0.85 },
  5:  { valueMult: 0.95, activeRatio: 1.00 },
  6:  { valueMult: 1.00, activeRatio: 1.00 },
  7:  { valueMult: 0.95, activeRatio: 0.95 },
  8:  { valueMult: 0.78, activeRatio: 0.85 },
  9:  { valueMult: 0.55, activeRatio: 0.70 },
  10: { valueMult: 0.38, activeRatio: 0.55 },
  11: { valueMult: 0.22, activeRatio: 0.40 },
  12: { valueMult: 0.12, activeRatio: 0.30 },
}


// ============================================================
// 四、GIS 站点数据（用于散点图/热力图）
// ============================================================

export interface GisStationPoint {
  name: string
  coord: [number, number]
  density: number
  type: '灯诱' | '性诱' | '测报' | '气象' | '墒情'
  city: string
  level: number // 1-5
}

/**
 * 根据 CITIES 基础数据生成各城市站点分布
 * 密度值基于城市 monitorValue 按比例分配
 */
export function generateStationPoints(): GisStationPoint[] {
  const points: GisStationPoint[] = []
  const stationTypes: Array<{ type: GisStationPoint['type']; weight: number }> = [
    { type: '灯诱', weight: 0.35 },
    { type: '测报', weight: 0.25 },
    { type: '性诱', weight: 0.20 },
    { type: '气象', weight: 0.12 },
    { type: '墒情', weight: 0.08 },
  ]

  for (const city of CITIES) {
    const cityPoints = city.stations
    let typeIndex = 0

    for (let i = 0; i < cityPoints; i++) {
      const st = stationTypes[typeIndex % stationTypes.length]
      typeIndex++

      // 在城市坐标附近随机偏移
      const offsetLng = (Math.random() - 0.5) * 0.8
      const offsetLat = (Math.random() - 0.5) * 0.5

      // 密度值：基于城市 monitorValue + 随机波动
      const baseDensity = Math.round(city.monitorValue / city.stations)
      const densityVariance = Math.round(baseDensity * (0.5 + Math.random()))
      const density = Math.max(5, baseDensity + densityVariance)

      // 等级：基于密度
      const level = density >= 70 ? 5 : density >= 50 ? 4 : density >= 30 ? 3 : density >= 15 ? 2 : 1

      points.push({
        name: `${city.name.slice(0, 2)}${st.type}站${i + 1}`,
        coord: [city.coord[0] + offsetLng, city.coord[1] + offsetLat],
        density,
        type: st.type,
        city: city.name,
        level,
      })
    }
  }

  return points
}


// ============================================================
// 五、工具函数
// ============================================================

/** 根据城市名获取监测值（带月份和虫种系数） */
export function getCityMonitorValue(
  cityName: string,
  month: number = new Date().getMonth() + 1,
  pestMapKey: string = 'mian'
): number {
  const city = CITY_MAP[cityName]
  if (!city) return 0

  const monthCfg = MONTH_MULTIPLIERS[month] || MONTH_MULTIPLIERS[6]
  const pestCfg = PEST_TYPES.find(p => p.mapKey === pestMapKey) || PEST_TYPES[0]

  return Math.round(city.monitorValue * monthCfg.valueMult * pestCfg.baseMultiplier)
}

/** 获取危险等级标签 */
export function getHazardLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '1级·低', 2: '2级·中低', 3: '3级·中等', 4: '4级·高', 5: '5级·极高'
  }
  return labels[level] || '未知'
}

/** 获取所有城市的地图标记数据（用于 ECharts scatter/heatmap） */
export function getCityMarkersForMap(pestMapKey: string = 'mian', month: number = new Date().getMonth() + 1) {
  const pestCfg = PEST_TYPES.find(p => p.mapKey === pestMapKey) || PEST_TYPES[0]
  const monthCfg = MONTH_MULTIPLIERS[month] || MONTH_MULTIPLIERS[6]

  return CITIES
    .filter(city => pestCfg.activeCities.includes(city.name))
    .map(city => ({
      name: city.name,
      coord: city.coord,
      value: Math.max(80, Math.round(city.monitorValue * monthCfg.valueMult * pestCfg.baseMultiplier)),
      city: city.name,
      pestType: pestMapKey,
    }))
}


// ============================================================
// 六、左侧面板 — 行政区树 + 图表数据
// ============================================================

export interface CityTreeItem {
  key: string
  name: string
}

/** 行政区树城市列表（左侧面板） */
export const CITY_TREE: CityTreeItem[] = [
  { key: 'jinan', name: '济南市' },
  { key: 'qingdao', name: '青岛市' },
  { key: 'yantai', name: '烟台市' },
  { key: 'weifang', name: '潍坊市' },
  { key: 'linyi', name: '临沂市' },
  { key: 'zibo', name: '淄博市' },
  { key: 'jining', name: '济宁市' },
  { key: 'taian', name: '泰安市' },
  { key: 'weihai', name: '威海市' },
  { key: 'dezhou', name: '德州市' },
  { key: 'liaocheng', name: '聊城市' },
  { key: 'binzhou', name: '滨州市' },
  { key: 'heze', name: '菏泽市' },
  { key: 'zaozhuang', name: '枣庄市' },
  { key: 'rizhao', name: '日照市' },
  { key: 'dongying', name: '东营市' },
]

/** 城市名映射 Record<key, name> */
export const CITY_KEY_TO_NAME: Record<string, string> = Object.fromEntries(
  CITY_TREE.map(c => [c.key, c.name])
)

/** 左侧面板虫种 Tab */
export const PEST_TABS_LEFT = [
  { key: 'grainCotton', label: '粮棉虫' },
  { key: 'cornBorer', label: '玉米螟' },
  { key: 'locust', label: '蝗虫' }
]

/** 月份标签 */
export const MONTHS_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

/**
 * 灯诱/性诱图表数据（3 虫种 × 2 类型 × 12 月）
 *
 * 数值逻辑：
 * - 粮棉虫（棉铃虫）：基数最高，夏季高峰
 * - 玉米螟：中等，略低于粮棉虫
 * - 蝗虫：最低，季节性最强
 * - 性诱值 ≈ 灯诱值的 75%（性诱灵敏度不同）
 */
export const CHART_DATA_MAP: Record<string, { light: number[]; sex: number[] }> = {
  grainCotton: {
    light: [120, 135, 180, 220, 280, 310, 290, 260, 230, 190, 150, 130],
    sex:   [90, 105, 150, 195, 250, 285, 270, 240, 210, 170, 130, 110]
  },
  cornBorer: {
    light: [80, 95, 140, 185, 240, 275, 260, 230, 200, 160, 120, 100],
    sex:   [60, 75, 120, 165, 220, 255, 240, 210, 180, 140, 100, 80]
  },
  locust: {
    light: [50, 65, 110, 155, 210, 245, 230, 200, 170, 130, 90, 70],
    sex:   [35, 50, 95, 140, 195, 230, 215, 185, 155, 115, 75, 55]
  }
}

/** 性诱时间单位类型 */
export type SexTimeUnit = 'day' | 'hou' | 'week'

/** 性诱时间单位选项 */
export const SEX_TIME_UNITS: { key: SexTimeUnit; label: string }[] = [
  { key: 'day', label: '日' },
  { key: 'hou', label: '侯' },
  { key: 'week', label: '周' }
]

/** 性诱 X 轴标签（按时间单位） */
export const SEX_X_LABELS: Record<SexTimeUnit, string[]> = {
  day:   Array.from({ length: 12 }, (_, i) => `${i + 1}日`),
  hou:   Array.from({ length: 12 }, (_, i) => `${i + 1}侯`),
  week:  Array.from({ length: 12 }, (_, i) => `${i + 1}周`)
}

/** 三种虫种 × 三种时间单位的性诱数据 */
export const SEX_DATA_BY_UNIT: Record<string, Record<SexTimeUnit, number[]>> = {
  grainCotton: {
    day:  [28, 35, 42, 55, 68, 82, 95, 88, 75, 58, 40, 30],
    hou:  [90, 105, 150, 195, 250, 285, 270, 240, 210, 170, 130, 110],
    week: [180, 210, 280, 340, 420, 480, 450, 400, 350, 280, 200, 160]
  },
  cornBorer: {
    day:  [18, 24, 32, 45, 58, 72, 85, 78, 62, 46, 28, 20],
    hou:  [60, 75, 120, 165, 220, 255, 240, 210, 180, 140, 100, 80],
    week: [120, 155, 225, 290, 370, 430, 400, 350, 300, 230, 155, 115]
  },
  locust: {
    day:  [10, 15, 22, 35, 48, 62, 75, 68, 52, 36, 18, 12],
    hou:  [35, 50, 95, 140, 195, 230, 215, 185, 155, 115, 75, 55],
    week: [70, 100, 175, 245, 330, 390, 360, 310, 260, 190, 120, 80]
  }
}


// ============================================================
// 七、底部视频监控区域 — 月度视频数据
// ============================================================

export interface VideoItem {
  id: string
  title: string
  region: 'north' | 'center' | 'south'
  regionLabel: string
  location: string
  sceneIcon: string
  sceneLabel: string
  typeTag: string
  bgGradient: string
  imageUrl: string
  status: 'online' | 'offline' | 'recording'
  statusText: string
  signal: number
}

/** 底部面板虫种 Tab */
export const VIDEO_PEST_TABS = [
  { key: 'bollworm' as const, label: '棉铃虫' },
  { key: 'corn_borer' as const, label: '玉米螟' },
  { key: 'stem_borer' as const, label: '螟虫' }
]

/**
 * 12 个月份 × 3 个视频的监控数据
 *
 * 每个月对应山东省不同农业场景：
 * - 北部：鲁北/济南/德州/聊城片区（小麦/玉米主产区）
 * - 中部：潍坊/滨州/东营/济宁片区（棉花/蔬菜主产区）
 * - 南部：临沂/日照/青岛/威海片区（果树/茶叶/稻作）
 */
export const VIDEO_MONTHLY_DATA: Record<number, VideoItem[]> = {
  1: [
    { id: 'jan-001', title: '冬小麦越冬期监测', region: 'north', regionLabel: '鲁北片区', location: '德州陵城示范基地', sceneIcon: '❄️', sceneLabel: '越冬监测', typeTag: '作物长势', bgGradient: 'linear-gradient(135deg, rgba(30,58,95,0.95), rgba(15,35,60,0.9))', imageUrl: '/images/video-jan.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'jan-002', title: '温室大棚环境监控', region: 'center', regionLabel: '潍坊片区', location: '寿光蔬菜产业园', sceneIcon: '🏠', sceneLabel: '设施农业', typeTag: '温室环境', bgGradient: 'linear-gradient(135deg, rgba(20,50,75,0.95), rgba(10,38,55,0.9))', imageUrl: '/images/video-jan.jpg', status: 'recording', statusText: '录像中', signal: 3 },
    { id: 'jan-003', title: '南部果园防冻监测', region: 'south', regionLabel: '临沂片区', location: '蒙阴苹果种植园', sceneIcon: '🍎', sceneLabel: '果树防冻', typeTag: '果园管理', bgGradient: 'linear-gradient(135deg, rgba(25,45,70,0.95), rgba(15,32,52,0.9))', imageUrl: '/images/video-jan.jpg', status: 'online', statusText: '直播中', signal: 4 }
  ],
  2: [
    { id: 'feb-001', title: '小麦返青期长势监测', region: 'north', regionLabel: '鲁北片区', location: '滨州博兴示范基地', sceneIcon: '🌱', sceneLabel: '返青期', typeTag: '作物长势', bgGradient: 'linear-gradient(135deg, rgba(25,55,85,0.95), rgba(15,40,65,0.9))', imageUrl: '/images/video-feb.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'feb-002', title: '早春育苗温室监控', region: 'center', regionLabel: '潍坊片区', location: '青州花卉育苗基地', sceneIcon: '🌸', sceneLabel: '春季育苗', typeTag: '育苗管理', bgGradient: 'linear-gradient(135deg, rgba(18,48,72,0.95), rgba(12,35,55,0.9))', imageUrl: '/images/video-feb.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'feb-003', title: '茶园春季萌动监测', region: 'south', regionLabel: '日照片区', location: '岚山绿茶种植区', sceneIcon: '🍵', sceneLabel: '茶园管理', typeTag: '茶叶生产', bgGradient: 'linear-gradient(135deg, rgba(22,42,68,0.95), rgba(14,30,50,0.9))', imageUrl: '/images/video-feb.jpg', status: 'recording', statusText: '录像中', signal: 3 }
  ],
  3: [
    { id: 'mar-001', title: '小麦拔节期监测', region: 'north', regionLabel: '济南片区', location: '章丘高标准农田', sceneIcon: '🌾', sceneLabel: '拔节期', typeTag: '作物长势', bgGradient: 'linear-gradient(135deg, rgba(20,60,80,0.95), rgba(12,42,62,0.9))', imageUrl: '/images/video-mar.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'mar-002', title: '春耕作业现场监控', region: 'center', regionLabel: '潍坊片区', location: '高密粮食示范区', sceneIcon: '🚜', sceneLabel: '春耕作业', typeTag: '农机作业', bgGradient: 'linear-gradient(135deg, rgba(15,52,70,0.95), rgba(8,38,55,0.9))', imageUrl: '/images/video-mar.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'mar-003', title: '果园林木开花监测', region: 'south', regionLabel: '临沂片区', location: '平邑金银花基地', sceneIcon: '🌼', sceneLabel: '花期监控', typeTag: '经济作物', bgGradient: 'linear-gradient(135deg, rgba(20,40,68,0.95), rgba(12,28,50,0.9))', imageUrl: '/images/video-mar.jpg', status: 'online', statusText: '直播中', signal: 3 }
  ],
  4: [
    { id: 'apr-001', title: '小麦孕穗期病虫害监测', region: 'north', regionLabel: '德州片区', location: '禹城小麦主产区', sceneIcon: '🔍', sceneLabel: '病虫测报', typeTag: '虫情监测', bgGradient: 'linear-gradient(135deg, rgba(35,55,75,0.95), rgba(20,40,60,0.9))', imageUrl: '/images/video-apr.jpg', status: 'recording', statusText: '录像中', signal: 4 },
    { id: 'apr-002', title: '棉花播种期监控', region: 'center', regionLabel: '菏泽片区', location: '曹县棉花示范基地', sceneIcon: '🌿', sceneLabel: '棉花播种', typeTag: '棉田管理', bgGradient: 'linear-gradient(135deg, rgba(18,50,68,0.95), rgba(10,36,52,0.9))', imageUrl: '/images/video-apr.jpg', status: 'online', statusText: '直播中', signal: 3 },
    { id: 'apr-003', title: '茶园春茶采摘监控', region: 'south', regionLabel: '日照片区', location: '莒县绿茶产区', sceneIcon: '🫖', sceneLabel: '茶叶采摘', typeTag: '茶叶生产', bgGradient: 'linear-gradient(135deg, rgba(22,44,66,0.95), rgba(14,30,48,0.9))', imageUrl: '/images/video-apr.jpg', status: 'online', statusText: '直播中', signal: 4 }
  ],
  5: [
    { id: 'may-001', title: '小麦灌浆期遥感监测', region: 'north', regionLabel: '济宁片区', location: '兖州粮食主产区', sceneIcon: '🛰️', sceneLabel: '遥感监测', typeTag: '产量预估', bgGradient: 'linear-gradient(135deg, rgba(28,58,78,0.95), rgba(16,42,62,0.9))', imageUrl: '/images/video-may.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'may-002', title: '棉花苗期长势监控', region: 'center', regionLabel: '东营片区', location: '利津盐碱地棉田', sceneIcon: '🌱', sceneLabel: '苗期管理', typeTag: '棉田管理', bgGradient: 'linear-gradient(135deg, rgba(16,48,68,0.95), rgba(8,34,52,0.9))', imageUrl: '/images/video-may.jpg', status: 'online', statusText: '直播中', signal: 3 },
    { id: 'may-003', title: '大蒜收获现场监控', region: 'south', regionLabel: '济宁片区', location: '金乡大蒜种植区', sceneIcon: '🧄', sceneLabel: '收获作业', typeTag: '蔬菜产业', bgGradient: 'linear-gradient(135deg, rgba(24,46,68,0.95), rgba(15,32,50,0.9))', imageUrl: '/images/video-may.jpg', status: 'recording', statusText: '录像中', signal: 4 }
  ],
  6: [
    { id: 'jun-001', title: '小麦收割机作业监控', region: 'north', regionLabel: '聊城片区', location: '阳谷小麦主产区', sceneIcon: '🌾', sceneLabel: '夏收作业', typeTag: '农机作业', bgGradient: 'linear-gradient(135deg, rgba(40,62,80,0.95), rgba(25,45,62,0.9))', imageUrl: '/images/video-jun.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'jun-002', title: '棉花蕾期虫情监测', region: 'center', regionLabel: '滨州片区', location: '无棣棉田示范区', sceneIcon: '🐛', sceneLabel: '棉铃虫监测', typeTag: '虫情预警', bgGradient: 'linear-gradient(135deg, rgba(35,50,70,0.95), rgba(20,36,55,0.9))', imageUrl: '/images/video-jun.jpg', status: 'recording', statusText: '录像中', signal: 4 },
    { id: 'jun-003', title: '水稻插秧作业监控', region: 'south', regionLabel: '临沂片区', location: '郯城稻米产区', sceneIcon: '🌾', sceneLabel: '水稻插秧', typeTag: '稻作农业', bgGradient: 'linear-gradient(135deg, rgba(18,48,70,0.95), rgba(10,34,52,0.9))', imageUrl: '/images/video-jun.jpg', status: 'online', statusText: '直播中', signal: 3 }
  ],
  7: [
    { id: 'jul-001', title: '玉米苗期杂草监测', region: 'north', regionLabel: '泰安片区', location: '肥城玉米示范区', sceneIcon: '🌽', sceneLabel: '玉米苗期', typeTag: '杂草防控', bgGradient: 'linear-gradient(135deg, rgba(30,58,75,0.95), rgba(18,42,60,0.9))', imageUrl: '/images/video-jul.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'jul-002', title: '棉花花铃期监测', region: 'center', regionLabel: '潍坊片区', location: '昌邑优质棉基地', sceneIcon: '🌸', sceneLabel: '花铃期', typeTag: '棉田管理', bgGradient: 'linear-gradient(135deg, rgba(22,52,72,0.95), rgba(13,38,56,0.9))', imageUrl: '/images/video-jul.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'jul-003', title: '花生田间管理监控', region: 'south', regionLabel: '青岛片区', location: '莱西花生主产区', sceneIcon: '🥜', sceneLabel: '花生管理', typeTag: '油料作物', bgGradient: 'linear-gradient(135deg, rgba(20,46,68,0.95), rgba(12,32,50,0.9))', imageUrl: '/images/video-jul.jpg', status: 'online', statusText: '直播中', signal: 3 }
  ],
  8: [
    { id: 'aug-001', title: '玉米穗期病虫害监测', region: 'north', regionLabel: '淄博片区', location: '桓台玉米高产田', sceneIcon: '🔍', sceneLabel: '病虫测报', typeTag: '虫情监测', bgGradient: 'linear-gradient(135deg, rgba(32,55,72,0.95), rgba(19,40,58,0.9))', imageUrl: '/images/video-aug.jpg', status: 'recording', statusText: '录像中', signal: 4 },
    { id: 'aug-002', title: '棉花吐絮期监测', region: 'center', regionLabel: '东营片区', location: '广饶棉花示范区', sceneIcon: '☁️', sceneLabel: '吐絮期', typeTag: '棉田管理', bgGradient: 'linear-gradient(135deg, rgba(25,50,70,0.95), rgba(15,36,54,0.9))', imageUrl: '/images/video-aug.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'aug-003', title: '果园果实膨大期监控', region: 'south', regionLabel: '烟台片区', location: '栖霞苹果示范园', sceneIcon: '🍎', sceneLabel: '果实发育', typeTag: '果园管理', bgGradient: 'linear-gradient(135deg, rgba(22,44,66,0.95), rgba(13,30,48,0.9))', imageUrl: '/images/video-aug.jpg', status: 'online', statusText: '直播中', signal: 4 }
  ],
  9: [
    { id: 'sep-001', title: '玉米成熟期产量预估', region: 'north', regionLabel: '济南片区', location: '历城玉米主产区', sceneIcon: '🌽', sceneLabel: '成熟期', typeTag: '产量预估', bgGradient: 'linear-gradient(135deg, rgba(38,60,78,0.95), rgba(23,44,62,0.9))', imageUrl: '/images/video-sep.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'sep-002', title: '棉花采收机作业监控', region: 'center', regionLabel: '滨州片区', location: '惠民棉田核心区', sceneIcon: '🚜', sceneLabel: '机采作业', typeTag: '棉田管理', bgGradient: 'linear-gradient(135deg, rgba(28,52,72,0.95), rgba(17,38,56,0.9))', imageUrl: '/images/video-sep.jpg', status: 'online', statusText: '直播中', signal: 3 },
    { id: 'sep-003', title: '苹果着色期品质监控', region: 'south', regionLabel: '威海片区', location: '文登苹果精品园', sceneIcon: '🍎', sceneLabel: '着色管理', typeTag: '果园管理', bgGradient: 'linear-gradient(135deg, rgba(24,46,68,0.95), rgba(15,32,50,0.9))', imageUrl: '/images/video-sep.jpg', status: 'recording', statusText: '录像中', signal: 4 }
  ],
  10: [
    { id: 'oct-001', title: '玉米秋收作业监控', region: 'north', regionLabel: '德州片区', location: '乐陵玉米高产田', sceneIcon: '🌾', sceneLabel: '秋收作业', typeTag: '农机作业', bgGradient: 'linear-gradient(135deg, rgba(42,62,80,0.95), rgba(26,46,64,0.9))', imageUrl: '/images/video-oct.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'oct-002', title: '冬小麦播种监控', region: 'center', regionLabel: '济宁片区', location: '曲阜小麦示范区', sceneIcon: '🌱', sceneLabel: '秋播作业', typeTag: '麦播管理', bgGradient: 'linear-gradient(135deg, rgba(30,54,74,0.95), rgba(18,40,58,0.9))', imageUrl: '/images/video-oct.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'oct-003', title: '苹果采摘季监控', region: 'south', regionLabel: '烟台片区', location: '蓬莱苹果产区', sceneIcon: '🧺', sceneLabel: '苹果采摘', typeTag: '果园管理', bgGradient: 'linear-gradient(135deg, rgba(26,48,70,0.95), rgba(16,34,52,0.9))', imageUrl: '/images/video-oct.jpg', status: 'online', statusText: '直播中', signal: 3 }
  ],
  11: [
    { id: 'nov-001', title: '小麦出苗期监测', region: 'north', regionLabel: '聊城片区', location: '茌平小麦主产区', sceneIcon: '🌱', sceneLabel: '出苗期', typeTag: '作物长势', bgGradient: 'linear-gradient(135deg, rgba(28,52,72,0.95), rgba(17,38,56,0.9))', imageUrl: '/images/video-nov.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'nov-002', title: '大棚蔬菜冬季生产', region: 'center', regionLabel: '潍坊片区', location: '安丘蔬菜基地', sceneIcon: '🥬', sceneLabel: '设施蔬菜', typeTag: '蔬菜生产', bgGradient: 'linear-gradient(135deg, rgba(22,48,68,0.95), rgba(13,35,53,0.9))', imageUrl: '/images/video-nov.jpg', status: 'recording', statusText: '录像中', signal: 3 },
    { id: 'nov-003', title: '茶园冬季管护监控', region: 'south', regionLabel: '日照片区', location: '五莲绿茶产区', sceneIcon: '🍃', sceneLabel: '茶园管护', typeTag: '茶叶生产', bgGradient: 'linear-gradient(135deg, rgba(24,44,66,0.95), rgba(15,32,50,0.9))', imageUrl: '/images/video-nov.jpg', status: 'online', statusText: '直播中', signal: 4 }
  ],
  12: [
    { id: 'dec-001', title: '小麦越冬前监测', region: 'north', regionLabel: '菏泽片区', location: '郓城小麦示范区', sceneIcon: '❄️', sceneLabel: '越冬准备', typeTag: '作物长势', bgGradient: 'linear-gradient(135deg, rgba(25,50,72,0.95), rgba(15,36,56,0.9))', imageUrl: '/images/video-dec.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'dec-002', title: '温室草莓成熟监控', region: 'center', regionLabel: '临沂片区', location: '兰山草莓园区', sceneIcon: '🍓', sceneLabel: '草莓采摘', typeTag: '设施农业', bgGradient: 'linear-gradient(135deg, rgba(35,50,68,0.95), rgba(20,36,54,0.9))', imageUrl: '/images/video-dec.jpg', status: 'online', statusText: '直播中', signal: 4 },
    { id: 'dec-003', title: '果园冬季修剪监控', region: 'south', regionLabel: '威海片区', location: '荣成苹果示范园', sceneIcon: '✂️', sceneLabel: '冬季修剪', typeTag: '果园管理', bgGradient: 'linear-gradient(135deg, rgba(22,42,64,0.95), rgba(14,30,48,0.9))', imageUrl: '/images/video-dec.jpg', status: 'recording', statusText: '录像中', signal: 3 }
  ]
}
