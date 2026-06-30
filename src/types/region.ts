export interface Region {
  id: string
  name: string
  code: string
  level: RegionLevel
  parentId?: string
  children?: Region[]
  longitude?: number
  latitude?: number
  area?: number
  population?: number
}

export type RegionLevel = 'province' | 'city' | 'county' | 'town' | 'village'

export interface RegionTree {
  [key: string]: RegionNode
}

export interface RegionNode {
  id: string
  name: string
  code: string
  level: RegionLevel
  children?: RegionNode[]
}

export interface RegionStatistics {
  regionId: string
  regionName: string
  totalArea: number
  cultivatedArea: number
  pestCount: number
  deviceCount: number
}
