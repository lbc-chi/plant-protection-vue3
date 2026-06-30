/**
 * useGisStationData.ts - GIS 地图数据 Composable
 * 
 * 提供江苏省植保监测站点的空间分布数据和虫害密度热力数据。
 * 用于 GIS 地图的站点标记、热力图层和区域聚合可视化。
 */

export interface GisStationPoint {
  /** 站点名称 */
  name: string
  /** 坐标 [经度, 纬度] */
  coord: [number, number]
  /** 虫害密度值（用于热力图） */
  density: number
  /** 站点类型 */
  type: '灯诱' | '性诱' | '测报' | '气象' | '墒情'
  /** 所属城市 */
  city: string
  /** 危险等级 1-5 */
  level: number
}

export interface GisHeatmapPoint {
  name: string
  coord: [number, number]
  value: number
}

export interface GisCitySummary {
  city: string
  stations: number
  avgDensity: number
  maxDensity: number
  level: '高' | '中高' | '中' | '低'
}

/**
 * 山东省 16 地市植保监测站点空间分布数据
 * 模拟真实监测站点分布，虫害密度值基于地理特征
 */
export function useGisStationData() {
  const stationPoints: GisStationPoint[] = [
    // ===== 济南市 =====
    { name: '济南历下区灯诱站', coord: [117.05, 36.67], density: 28, type: '灯诱', city: '济南市', level: 2 },
    { name: '济南市中区测报站', coord: [117.0, 36.63], density: 45, type: '测报', city: '济南市', level: 3 },
    { name: '济南天桥区性诱站', coord: [116.97, 36.69], density: 32, type: '性诱', city: '济南市', level: 2 },
    { name: '济南历城区气象站', coord: [117.08, 36.7], density: 15, type: '气象', city: '济南市', level: 1 },
    { name: '济南章丘灯诱站', coord: [117.53, 36.68], density: 58, type: '灯诱', city: '济南市', level: 4 },
    { name: '济南长清测报站', coord: [116.73, 36.56], density: 38, type: '测报', city: '济南市', level: 3 },
    { name: '济南济阳墒情站', coord: [117.22, 36.98], density: 12, type: '墒情', city: '济南市', level: 1 },

    // ===== 青岛市 =====
    { name: '青岛市南灯诱站', coord: [120.38, 36.07], density: 62, type: '灯诱', city: '青岛市', level: 4 },
    { name: '青岛崂山测报站', coord: [120.47, 36.1], density: 72, type: '测报', city: '青岛市', level: 5 },
    { name: '青岛黄岛性诱站', coord: [120.15, 36.0], density: 55, type: '性诱', city: '青岛市', level: 4 },
    { name: '青岛城阳气向站', coord: [120.4, 36.3], density: 18, type: '气象', city: '青岛市', level: 1 },
    { name: '青岛即墨灯诱站', coord: [120.45, 36.38], density: 80, type: '灯诱', city: '青岛市', level: 5 },
    { name: '青岛胶州测报站', coord: [120.02, 36.27], density: 48, type: '测报', city: '青岛市', level: 3 },
    { name: '青岛平度灯诱站', coord: [119.96, 36.78], density: 68, type: '灯诱', city: '青岛市', level: 4 },

    // ===== 烟台市 =====
    { name: '烟台芝罘灯诱站', coord: [121.38, 37.53], density: 52, type: '灯诱', city: '烟台市', level: 4 },
    { name: '烟台莱山测报站', coord: [121.45, 37.48], density: 35, type: '测报', city: '烟台市', level: 3 },
    { name: '烟台蓬莱性诱站', coord: [120.75, 37.81], density: 42, type: '性诱', city: '烟台市', level: 3 },
    { name: '烟台龙口灯诱站', coord: [120.48, 37.65], density: 65, type: '灯诱', city: '烟台市', level: 4 },
    { name: '烟台招远测报站', coord: [120.4, 37.36], density: 28, type: '测报', city: '烟台市', level: 2 },

    // ===== 潍坊市 =====
    { name: '潍坊奎文灯诱站', coord: [119.12, 36.71], density: 75, type: '灯诱', city: '潍坊市', level: 5 },
    { name: '潍坊潍城测报站', coord: [119.08, 36.72], density: 60, type: '测报', city: '潍坊市', level: 4 },
    { name: '潍坊寿光性诱站', coord: [118.79, 36.86], density: 82, type: '性诱', city: '潍坊市', level: 5 },
    { name: '潍坊青州墒情站', coord: [118.48, 36.69], density: 22, type: '墒情', city: '潍坊市', level: 2 },
    { name: '潍坊诸城灯诱站', coord: [119.41, 35.99], density: 70, type: '灯诱', city: '潍坊市', level: 5 },
    { name: '潍坊高密测报站', coord: [119.75, 36.38], density: 55, type: '测报', city: '潍坊市', level: 4 },
    { name: '潍坊昌邑性诱站', coord: [119.38, 36.86], density: 48, type: '性诱', city: '潍坊市', level: 3 },

    // ===== 临沂市 =====
    { name: '临沂兰山灯诱站', coord: [118.35, 35.05], density: 68, type: '灯诱', city: '临沂市', level: 4 },
    { name: '临沂罗庄测报站', coord: [118.28, 35.0], density: 55, type: '测报', city: '临沂市', level: 4 },
    { name: '临沂河东性诱站', coord: [118.4, 35.08], density: 42, type: '性诱', city: '临沂市', level: 3 },
    { name: '临沂沂水灯诱站', coord: [118.63, 35.78], density: 60, type: '灯诱', city: '临沂市', level: 4 },
    { name: '临沂兰陵测报站', coord: [118.07, 34.86], density: 78, type: '测报', city: '临沂市', level: 5 },
    { name: '临沂平邑墒情站', coord: [117.63, 35.51], density: 18, type: '墒情', city: '临沂市', level: 1 },

    // ===== 济宁市 =====
    { name: '济宁任城灯诱站', coord: [116.58, 35.41], density: 55, type: '灯诱', city: '济宁市', level: 4 },
    { name: '济宁兖州测报站', coord: [116.78, 35.55], density: 38, type: '测报', city: '济宁市', level: 3 },
    { name: '济宁曲阜性诱站', coord: [116.98, 35.58], density: 25, type: '性诱', city: '济宁市', level: 2 },
    { name: '济宁邹城灯诱站', coord: [116.97, 35.41], density: 48, type: '灯诱', city: '济宁市', level: 3 },
    { name: '济宁微山气象站', coord: [117.13, 34.8], density: 15, type: '气象', city: '济宁市', level: 1 },

    // ===== 淄博市 =====
    { name: '淄博张店灯诱站', coord: [118.05, 36.81], density: 45, type: '灯诱', city: '淄博市', level: 3 },
    { name: '淄博淄川测报站', coord: [117.97, 36.64], density: 52, type: '测报', city: '淄博市', level: 4 },
    { name: '淄博临淄性诱站', coord: [118.3, 36.82], density: 38, type: '性诱', city: '淄博市', level: 3 },
    { name: '淄博桓台墒情站', coord: [118.1, 36.96], density: 12, type: '墒情', city: '淄博市', level: 1 },

    // ===== 泰安市 =====
    { name: '泰安泰山灯诱站', coord: [117.13, 36.19], density: 35, type: '灯诱', city: '泰安市', level: 3 },
    { name: '泰安岱岳测报站', coord: [117.0, 36.18], density: 42, type: '测报', city: '泰安市', level: 3 },
    { name: '泰安新泰性诱站', coord: [117.77, 35.91], density: 58, type: '性诱', city: '泰安市', level: 4 },

    // ===== 德州市 =====
    { name: '德州德城灯诱站', coord: [116.3, 37.45], density: 65, type: '灯诱', city: '德州市', level: 4 },
    { name: '德州禹城测报站', coord: [116.63, 36.94], density: 72, type: '测报', city: '德州市', level: 5 },
    { name: '德州乐陵性诱站', coord: [117.22, 37.73], density: 52, type: '性诱', city: '德州市', level: 4 },
    { name: '德州齐河墒情站', coord: [116.76, 36.79], density: 18, type: '墒情', city: '德州市', level: 1 },

    // ===== 聊城市 =====
    { name: '聊城东昌府灯诱站', coord: [116.0, 36.45], density: 55, type: '灯诱', city: '聊城市', level: 4 },
    { name: '聊城临清测报站', coord: [115.72, 36.85], density: 48, type: '测报', city: '聊城市', level: 3 },
    { name: '聊城莘县性诱站', coord: [115.67, 36.24], density: 68, type: '性诱', city: '聊城市', level: 4 },

    // ===== 滨州市 =====
    { name: '滨州滨城灯诱站', coord: [118.02, 37.38], density: 62, type: '灯诱', city: '滨州市', level: 4 },
    { name: '滨州邹平测报站', coord: [117.73, 36.86], density: 72, type: '测报', city: '滨州市', level: 5 },
    { name: '滨州博兴性诱站', coord: [118.13, 37.14], density: 45, type: '性诱', city: '滨州市', level: 3 },

    // ===== 菏泽市 =====
    { name: '菏泽牡丹灯诱站', coord: [115.45, 35.25], density: 78, type: '灯诱', city: '菏泽市', level: 5 },
    { name: '菏泽曹县测报站', coord: [115.54, 34.83], density: 82, type: '测报', city: '菏泽市', level: 5 },
    { name: '菏泽单县性诱站', coord: [116.08, 34.82], density: 68, type: '性诱', city: '菏泽市', level: 4 },
    { name: '菏泽郓城墒情站', coord: [115.94, 35.6], density: 20, type: '墒情', city: '菏泽市', level: 2 },

    // ===== 东营市 =====
    { name: '东营东营区灯诱站', coord: [118.52, 37.46], density: 58, type: '灯诱', city: '东营市', level: 4 },
    { name: '东营河口测报站', coord: [118.53, 37.88], density: 65, type: '测报', city: '东营市', level: 4 },
    { name: '东营垦利性诱站', coord: [118.54, 37.59], density: 48, type: '性诱', city: '东营市', level: 3 },

    // ===== 威海市 =====
    { name: '威海环翠灯诱站', coord: [122.12, 37.51], density: 42, type: '灯诱', city: '威海市', level: 3 },
    { name: '威海文登测报站', coord: [122.05, 37.2], density: 35, type: '测报', city: '威海市', level: 3 },
    { name: '威海荣成性诱站', coord: [122.41, 37.16], density: 28, type: '性诱', city: '威海市', level: 2 },

    // ===== 日照市 =====
    { name: '日照东港灯诱站', coord: [119.46, 35.42], density: 52, type: '灯诱', city: '日照市', level: 4 },
    { name: '日照五莲测报站', coord: [119.21, 35.75], density: 48, type: '测报', city: '日照市', level: 3 },
    { name: '日照莒县墒情站', coord: [118.84, 35.58], density: 15, type: '墒情', city: '日照市', level: 1 },

    // ===== 枣庄市 =====
    { name: '枣庄市中灯诱站', coord: [117.55, 34.86], density: 62, type: '灯诱', city: '枣庄市', level: 4 },
    { name: '枣庄滕州测报站', coord: [117.15, 35.09], density: 58, type: '测报', city: '枣庄市', level: 4 },
    { name: '枣庄薛城性诱站', coord: [117.27, 34.8], density: 45, type: '性诱', city: '枣庄市', level: 3 },
  ]

  /**
   * 生成热力图专用的高密度点数据（每个监测站点周围生成 3-5 个虚拟采样点）
   * 用于热力图层展示虫害密度区域性聚集
   */
  const heatmapPoints: GisHeatmapPoint[] = stationPoints.flatMap(sp => {
    const basePoints: GisHeatmapPoint[] = [
      { name: sp.name, coord: sp.coord, value: sp.density }
    ]
    // 在站点周围生成扩散点，形成区域性热力聚集
    const spreadCount = sp.density > 60 ? 5 : sp.density > 40 ? 3 : 2
    for (let i = 0; i < spreadCount; i++) {
      const angle = (Math.PI * 2 * i) / spreadCount
      const distance = 0.08 + Math.random() * 0.15
      const lng = sp.coord[0] + Math.cos(angle) * distance
      const lat = sp.coord[1] + Math.sin(angle) * distance * 0.7
      // 扩散点的密度值在基准值基础上随机波动
      const spreadValue = Math.max(5, sp.density * (0.5 + Math.random() * 0.5))
      basePoints.push({
        name: `${sp.name}附近`,
        coord: [lng, lat],
        value: Math.round(spreadValue)
      })
    }
    return basePoints
  })

  /**
   * 各城市汇总统计
   */
  const citySummaries: GisCitySummary[] = (() => {
    const cityMap = new Map<string, { stations: number; totalDensity: number; maxDensity: number }>()
    stationPoints.forEach(sp => {
      const existing = cityMap.get(sp.city) || { stations: 0, totalDensity: 0, maxDensity: 0 }
      existing.stations++
      existing.totalDensity += sp.density
      existing.maxDensity = Math.max(existing.maxDensity, sp.density)
      cityMap.set(sp.city, existing)
    })
    return Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      stations: data.stations,
      avgDensity: Math.round(data.totalDensity / data.stations),
      maxDensity: data.maxDensity,
      level: data.maxDensity >= 70 ? '高' : data.maxDensity >= 50 ? '中高' : data.maxDensity >= 30 ? '中' : '低'
    }))
  })()

  /** 站点类型统计 */
  const stationTypeStats = [
    { type: '灯诱', count: stationPoints.filter(s => s.type === '灯诱').length, color: '#f59e0b' },
    { type: '测报', count: stationPoints.filter(s => s.type === '测报').length, color: '#ef4444' },
    { type: '性诱', count: stationPoints.filter(s => s.type === '性诱').length, color: '#3b82f6' },
    { type: '气象', count: stationPoints.filter(s => s.type === '气象').length, color: '#10b981' },
    { type: '墒情', count: stationPoints.filter(s => s.type === '墒情').length, color: '#6366f1' },
  ]

  /** 按虫害密度等级聚合 */
  const levelAggregation = [
    { level: 5, label: '极高', count: stationPoints.filter(s => s.level === 5).length, color: '#dc2626' },
    { level: 4, label: '高危', count: stationPoints.filter(s => s.level === 4).length, color: '#f97316' },
    { level: 3, label: '中等', count: stationPoints.filter(s => s.level === 3).length, color: '#eab308' },
    { level: 2, label: '低危', count: stationPoints.filter(s => s.level === 2).length, color: '#3b82f6' },
    { level: 1, label: '安全', count: stationPoints.filter(s => s.level === 1).length, color: '#10b981' },
  ]

  return {
    stationPoints,
    heatmapPoints,
    citySummaries,
    stationTypeStats,
    levelAggregation,
    totalStations: stationPoints.length,
    maxDensity: Math.max(...stationPoints.map(s => s.density)),
    avgDensity: Math.round(stationPoints.reduce((sum, s) => sum + s.density, 0) / stationPoints.length),
  }
}