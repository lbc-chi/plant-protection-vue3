import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '智慧植保指挥平台' }
  },
  {
    path: '/fullscreen',
    name: 'FullscreenDashboard',
    component: () => import('@/views/FullscreenDashboard.vue'),
    meta: { title: '全屏指挥大屏', fullscreen: true }
  },
  {
    path: '/overview',
    name: 'Overview',
    component: () => import('@/views/OverviewView.vue'),
    meta: { title: '数据概览' }
  },
  {
    path: '/devices',
    name: 'DeviceList',
    component: () => import('@/views/DeviceListView.vue'),
    meta: { title: '设备管理' }
  },
  {
    path: '/devices/:id',
    name: 'DeviceDetail',
    component: () => import('@/views/DeviceDetailView.vue'),
    meta: { title: '设备详情' },
    props: true
  },
  {
    path: '/pests',
    name: 'PestMonitoring',
    component: () => import('@/views/PestMonitoringView.vue'),
    meta: { title: '虫害监测' }
  },
  {
    path: '/weather',
    name: 'WeatherAnalysis',
    component: () => import('@/views/WeatherAnalysisView.vue'),
    meta: { title: '气象分析' }
  },
  {
    path: '/project',
    name: 'ProjectOverview',
    component: () => import('@/views/ProjectOverviewView.vue'),
    meta: { title: '工程概况' }
  },
  {
    path: '/region/:id',
    name: 'RegionDetail',
    component: () => import('@/views/RegionDetailView.vue'),
    meta: { title: '地区详情' },
    props: true
  },
  {
    path: '/pest-topic',
    name: 'PestTopic',
    component: () => import('@/views/PestTopicView.vue'),
    meta: { title: '虫害专题' }
  },
  {
    path: '/station-distribution',
    name: 'StationDistribution',
    component: () => import('@/views/StationDistributionView.vue'),
    meta: { title: '站点分布' }
  },
  {
    path: '/pest-gis',
    name: 'PestGIS',
    component: () => import('@/views/PestGISView.vue'),
    meta: { title: 'GIS全域网图' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  document.title = title ? `${title} - 智慧植保指挥平台` : '智慧植保指挥平台'

  // 由于没有登录页，对所有路由放行
  next()
})

export default router
