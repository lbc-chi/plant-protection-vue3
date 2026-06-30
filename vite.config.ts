import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function createMockApiMiddleware(): Plugin {
  return {
    name: 'mock-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/regions')) {
          console.log('[Mock API] 📡 拦截 /api/regions 请求，返回山东省行政区划数据')
          
          const mockData = {
            provinces: [
              {
                code: "370000",
                name: "山东省",
                cities: [
                  { code: "370100", name: "济南市", districts: [
                    { code: "370102", name: "历下区" }, { code: "370103", name: "市中区" },
                    { code: "370104", name: "槐荫区" }, { code: "370105", name: "天桥区" },
                    { code: "370112", name: "历城区" }, { code: "370113", name: "长清区" },
                    { code: "370114", name: "章丘区" }, { code: "370115", name: "济阳区" },
                    { code: "370116", name: "莱芜区" }, { code: "370117", name: "钢城区" },
                    { code: "370124", name: "平阴县" }, { code: "370126", name: "商河县" }
                  ]},
                  { code: "370200", name: "青岛市", districts: [
                    { code: "370202", name: "市南区" }, { code: "370203", name: "市北区" },
                    { code: "370211", name: "黄岛区" }, { code: "370213", name: "崂山区" },
                    { code: "370214", name: "李沧区" }, { code: "370215", name: "城阳区" },
                    { code: "370216", name: "即墨区" }, { code: "370281", name: "胶州市" },
                    { code: "370282", name: "平度市" }, { code: "370283", name: "莱西市" }
                  ]},
                  { code: "370300", name: "淄博市", districts: [
                    { code: "370302", name: "淄川区" }, { code: "370303", name: "张店区" },
                    { code: "370304", name: "博山区" }, { code: "370305", name: "临淄区" },
                    { code: "370306", name: "周村区" }, { code: "370321", name: "桓台县" },
                    { code: "370322", name: "高青县" }, { code: "370323", name: "沂源县" }
                  ]},
                  { code: "371100", name: "日照市", districts: [
                    { code: "371102", name: "东港区" }, { code: "371103", name: "岚山区" },
                    { code: "371121", name: "五莲县" }, { code: "371122", name: "莒县" }
                  ]},
                  { code: "371300", name: "临沂市", districts: [
                    { code: "371302", name: "兰山区" }, { code: "371311", name: "罗庄区" },
                    { code: "371312", name: "河东区" }, { code: "371321", name: "沂南县" },
                    { code: "371329", name: "郯城县" }, { code: "371325", name: "莒南县" }
                  ]}
                ]
              }
            ],
            updateTime: new Date().toISOString()
          }
          
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Mock-Data': 'true'
          })
          res.end(JSON.stringify(mockData))
          return
        }
        
        if (req.url?.startsWith('/api/statistics')) {
          console.log('[Mock API] 📡 拦截 /api/statistics 请求，返回 Mock 数据')
          
          const mockStats = {
            stations: 124,
            devices: 1244,
            reports: 365,
            lights: 892,
            monthlyPests: {
              bollworm: 12.5,
              cornBorer: 18.2,
              armyworm: 8.7,
              cornLeaf: 25.3
            },
            updateTime: new Date().toISOString()
          }
          
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Mock-Data': 'true'
          })
          res.end(JSON.stringify(mockStats, null, 2))
          return
        }
        
        if (req.url?.startsWith('/api/topics')) {
          console.log('[Mock API] 📡 拦截 /api/topics 请求，返回 Mock 数据')

          const mockTopics = {
            tasks: [
              { id: 1, title: '棉铃虫发生趋势分析', description: '基于2024年监测数据分析全省棉铃虫时空分布规律及防治建议', icon: '🐛', tag: '热门', tagType: 'danger', priority: 'high', status: 'in-progress', author: '植保专家组', date: new Date().toISOString(), count: 128, url: '/analysis/bollworm-trend' },
              { id: 2, title: '玉米螟防治效果评估', description: '评估性诱剂、生物农药等绿色防控技术的田间应用效果', icon: '🦗', tag: '进行中', tagType: 'warning', priority: 'high', status: 'in-progress', author: '技术支撑团队', date: new Date(Date.now() - 86400000).toISOString(), count: 86, url: '/analysis/corn-borer-evaluation' },
              { id: 3, title: '粘虫迁飞路径预测', description: '结合气象数据和雷达监测，预测粘虫迁飞路径及降落区域', icon: '🪲', tag: '新任务', tagType: 'info', priority: 'medium', status: 'pending', author: '预报中心', date: new Date(Date.now() - 172800000).toISOString(), count: 45, url: '/analysis/armyworm-migration' },
              { id: 4, title: '灯光诱捕数据统计报告', description: '汇总全省测报灯虫量数据，分析年度虫情变化趋势', icon: '💡', tag: '已完成', tagType: 'success', priority: 'medium', status: 'completed', author: '数据中心', date: new Date(Date.now() - 259200000).toISOString(), count: 256, url: '/analysis/light-trap-report' },
              { id: 5, title: '小麦条锈病监测预警', description: '实时监控小麦主产区条锈病发生动态，发布预警信息', icon: '🌾', tag: '重要', tagType: 'danger', priority: 'high', status: 'pending', author: '病害监测组', date: new Date().toISOString(), count: 92, url: '/analysis/wheat-rust' }
            ],
            updateTime: new Date().toISOString()
          }

          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Mock-Data': 'true'
          })
          res.end(JSON.stringify(mockTopics, null, 2))
          return
        }

        if (req.url?.startsWith('/api/points')) {
          console.log('[Mock API] 📡 拦截 /api/points 请求，返回虫害散点数据')

          const mockPoints = {
            points: [
              { name: '济南市历城区监测站', value: 156, level: 5, coord: [117.07, 36.68], pestType: '棉铃虫', updateTime: new Date().toISOString() },
              { name: '济南市长清区监测站', value: 89, level: 3, coord: [116.75, 36.55], pestType: '玉米螟', updateTime: new Date().toISOString() },
              { name: '青岛市市南区监测站', value: 234, level: 5, coord: [120.38, 36.06], pestType: '粘虫', updateTime: new Date().toISOString() },
              { name: '青岛市黄岛区监测站', value: 67, level: 2, coord: [120.15, 35.95], pestType: '小麦锈病', updateTime: new Date().toISOString() },
              { name: '淄博市张店区监测站', value: 145, level: 4, coord: [118.05, 36.81], pestType: '棉铃虫', updateTime: new Date().toISOString() },
              { name: '淄博市临淄区监测站', value: 78, level: 3, coord: [118.30, 36.82], pestType: '玉米螟', updateTime: new Date().toISOString() },
              { name: '日照市东港区监测站', value: 198, level: 5, coord: [119.46, 35.42], pestType: '粘虫', updateTime: new Date().toISOString() },
              { name: '日照市岚山区监测站', value: 45, level: 2, coord: [119.31, 35.12], pestType: '草地贪夜蛾', updateTime: new Date().toISOString() },
              { name: '临沂市兰山区监测站', value: 187, level: 5, coord: [118.35, 35.07], pestType: '棉铃虫', updateTime: new Date().toISOString() },
              { name: '临沂市罗庄区监测站', value: 92, level: 3, coord: [118.28, 34.99], pestType: '玉米螟', updateTime: new Date().toISOString() },
              { name: '临沂市沂南县监测站', value: 56, level: 2, coord: [118.47, 35.55], pestType: '小麦锈病', updateTime: new Date().toISOString() },
              { name: '潍坊市奎文区监测站', value: 134, level: 4, coord: [119.12, 36.71], pestType: '粘虫', updateTime: new Date().toISOString() },
              { name: '烟台市芝罘区监测站', value: 112, level: 4, coord: [121.39, 37.54], pestType: '棉铃虫', updateTime: new Date().toISOString() },
              { name: '威海市环翠区监测站', value: 43, level: 1, coord: [122.12, 37.51], pestType: '草地贪夜蛾', updateTime: new Date().toISOString() },
              { name: '济宁市任城区监测站', value: 167, level: 5, coord: [116.59, 35.41], pestType: '玉米螟', updateTime: new Date().toISOString() },
              { name: '泰安市泰山区监测站', value: 88, level: 3, coord: [117.13, 36.19], pestType: '小麦锈病', updateTime: new Date().toISOString() },
              { name: '德州市德城区监测站', value: 124, level: 4, coord: [116.31, 37.46], pestType: '棉铃虫', updateTime: new Date().toISOString() },
              { name: '聊城市东昌府区监测站', value: 76, level: 3, coord: [115.98, 36.45], pestType: '粘虫', updateTime: new Date().toISOString() },
              { name: '滨州市滨城区监测站', value: 54, level: 2, coord: [117.97, 37.38], pestType: '草地贪夜蛾', updateTime: new Date().toISOString() },
              { name: '菏泽市牡丹区监测站', value: 201, level: 5, coord: [115.48, 35.25], pestType: '棉铃虫', updateTime: new Date().toISOString() }
            ],
            summary: {
              totalPoints: 20,
              highRiskCount: 7,
              mediumRiskCount: 6,
              lowRiskCount: 7,
              maxLevel: 5,
              avgValue: 118.4,
              pestTypes: ['棉铃虫', '玉米螟', '粘虫', '小麦锈病', '草地贪夜蛾']
            },
            updateTime: new Date().toISOString()
          }

          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Mock-Data': 'true'
          })
          res.end(JSON.stringify(mockPoints, null, 2))
          return
        }

        if (req.url?.startsWith('/api/trends')) {
          console.log('[Mock API] 📡 拦截 /api/trends 请求，返回30天趋势数据')

          const today = new Date()
          const dates: string[] = []
          const lightTrapData: number[] = []
          const pheromoneData: number[] = []
          const multiSpectralData: number[] = []

          for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            dates.push(date.toISOString().split('T')[0] as string)

            lightTrapData.push(Math.floor(Math.random() * 150 + 50 + Math.sin(i * 0.3) * 40))
            pheromoneData.push(Math.floor(Math.random() * 100 + 30 + Math.cos(i * 0.25) * 35))
            multiSpectralData.push(Math.floor(Math.random() * 80 + 20 + Math.sin(i * 0.2 + 1) * 25))
          }

          const mockTrends = {
            period: {
              startDate: dates[0],
              endDate: dates[29],
              days: 30
            },
            series: [
              {
                name: '测报灯',
                type: 'line',
                color: '#f59e0b',
                data: lightTrapData,
                unit: '头/日均',
                icon: '💡',
                description: '灯光诱捕虫量统计'
              },
              {
                name: '性诱剂',
                type: 'line',
                color: '#10b981',
                data: pheromoneData,
                unit: '头/日均',
                icon: '🧲',
                description: '性信息素诱捕统计'
              },
              {
                name: '多光谱',
                type: 'line',
                color: '#3b82f6',
                data: multiSpectralData,
                unit: '头/日均',
                icon: '🌈',
                description: '多光谱遥感监测'
              }
            ],
            categories: dates,
            statistics: {
              lightTrap: { avg: Math.round(lightTrapData.reduce((a, b) => a + b, 0) / 30), max: Math.max(...lightTrapData), min: Math.min(...lightTrapData) },
              pheromone: { avg: Math.round(pheromoneData.reduce((a, b) => a + b, 0) / 30), max: Math.max(...pheromoneData), min: Math.min(...pheromoneData) },
              multiSpectral: { avg: Math.round(multiSpectralData.reduce((a, b) => a + b, 0) / 30), max: Math.max(...multiSpectralData), min: Math.min(...multiSpectralData) }
            },
            updateTime: new Date().toISOString()
          }

          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Mock-Data': 'true'
          })
          res.end(JSON.stringify(mockTrends, null, 2))
          return
        }
        
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), createMockApiMiddleware()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts-vendor': ['echarts'],
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
