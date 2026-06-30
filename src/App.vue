<template>
  <div class="app-layout-v3">
    <!-- ===== 动态背景 ===== -->
    <div class="app-bg">
      <div class="app-bg__ambient"></div>
      <div class="app-bg__grid"></div>
      <div class="app-bg__vignette"></div>
    </div>

    <!-- ===== 主容器（全屏） ===== -->
    <div class="main-container">

      <!-- ========== 全局导航栏（Header 组件）—— 首页/DashboardView 自带导航栏，此处跳过 ========== -->
      <Header
        v-if="!isDashboardRoute"
        ref="headerRef"
        :show-title="true"
        :weather="platformWeatherFormatted"
        :nav-items="headerNavItems"
        :default-active-nav="activeTopTab"
        @nav-change="handleHeaderNavChange"
        @time-update="handleTimeUpdate"
        @panel-toggle="handlePanelToggle"
      />


      <!-- ========== 全屏中央内容区（DashboardView嵌入所有内容）========== -->
      <main class="fullscreen-content">
        <router-view v-slot="{ Component, route: currentRoute }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="currentRoute.fullPath" />
          </transition>
        </router-view>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/store/useDashboardStore'
import Header from '@/components/layout/Header.vue'

// ===== 路由实例 =====
const router = useRouter()
const route = useRoute()

// ===== Store 数据加载 =====
const store = useDashboardStore()
const { loading } = storeToRefs(store)

// ===== Header 组件相关 =====
const headerRef = ref<InstanceType<typeof Header> | null>(null)

/** 格式化天气数据给 Header 组件 */
const platformWeatherFormatted = computed(() => {
  const weather = store.dashboardV3Data?.platformInfo?.weather || {}
  const tempMatch = (weather.temperature || '17~28°C').match(/(\d+)~(\d+)/)
  
  return {
    tempMin: tempMatch ? parseInt(tempMatch[1]) : 17,
    tempMax: tempMatch ? parseInt(tempMatch[2]) : 28,
    description: weather.condition || '多云'
  }
})

/** Header 导航菜单项 */
const headerNavItems = computed(() => {
  const tabs = store.dashboardV3Data?.topTabs || ['首页', '虫害专题', '站点分布']
  const iconMap: Record<string, string> = {
    '首页': '🏠',
    '虫害专题': '🐛',
    '站点分布': '📍',
    '回溯查看': '⏪'
  }
  
  return tabs.map(tab => ({
    key: tab === '回溯查看' ? 'history' : tab === '虫害专题' ? 'pest' : tab === '站点分布' ? 'stations' : 'home',
    label: tab,
    icon: iconMap[tab] || '📌'
  }))
})

// ===== 布局状态 =====
const activeTopTab = ref('首页')

/** 首页/DashboardView 自带导航栏，隐藏 App 层 Header */
const isDashboardRoute = computed(() => {
  const path = route.path
  return path === '/' || path.startsWith('/pest-topic') || path.startsWith('/station-distribution')
})

/** 处理 Header 导航切换 */
function handleHeaderNavChange(item: any) {
  console.log('[App] Header 导航切换:', item.key, item.label)
  activeTopTab.value = item.label

  // 路由跳转逻辑
  switch (item.key) {
    case 'home':
      router.push('/')
      break
    case 'pest':
      router.push('/pest-topic')
      break
    case 'stations':
      router.push('/station-distribution')
      break
    default:
      router.push('/')
  }
}

/** 处理时间更新事件 */
function handleTimeUpdate(time: string) {
  // 可用于定时刷新数据等场景
  // console.log('[App] 时间更新:', time)
}

/** 处理面板切换事件（预留接口，供未来使用） */
function handlePanelToggle(isExpanded: boolean) {
  console.log(`[App] ☰ Header 触发面板切换: ${isExpanded ? '展开' : '收起'}`)
  // 可以在这里通过 provide/inject 或事件总线通知子组件
}

// ===== V3 数据接口（从Store获取）=====
const platformTitle = computed(() => store.dashboardV3Data?.platformInfo?.title || '山东省智慧植保综合指挥平台')


// ===== 生命周期 =====
onMounted(async () => {
  console.log('[App-V3] 🚀 开始加载V3大屏数据...')
  await store.fetchDashboardV3Data()
  console.log('[App-V3] ✅ V3数据加载完成')
})
</script>

<style scoped>
/* ========================================
   App.vue - 全局布局 + Header 组件
   （Header 组件已提取到独立文件）
   ======================================== */

@keyframes ambientDrift {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.1); }
  100% { transform: translate(-20px, 10px) scale(0.95); }
}

.app-layout-v3 {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #0B1120 100%);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

/* 动态背景 — 极光透明风 */
.app-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 环境光晕 — 极光色彩 */
.app-bg__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 1200px 700px at 10% 20%, rgba(0, 212, 170, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 900px 600px at 85% 10%, rgba(192, 132, 252, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 800px 500px at 50% 90%, rgba(0, 212, 170, 0.03) 0%, transparent 60%),
    radial-gradient(ellipse 700px 450px at 25% 65%, rgba(192, 132, 252, 0.04) 0%, transparent 60%);
  animation: ambientDrift 30s ease-in-out infinite alternate;
}

.app-bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 170, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(192, 132, 252, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%);
}

/* 光晕渐变 - 极光流动 */
.app-bg::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 170, 0.08), transparent 70%);
  top: -200px;
  left: -100px;
  animation: ambientDrift 35s ease-in-out infinite alternate;
}

.app-bg::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.06), transparent 70%);
  bottom: -150px;
  right: -100px;
  animation: ambientDrift 25s ease-in-out infinite alternate-reverse;
}

.app-bg__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(11, 17, 32, 0.5) 100%);
}


/* 主容器 */
.main-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}


/* ====== Header 区域（自动撑开高度）===== */
.main-container :deep(.app-header) {
  flex-shrink: 0;
  z-index: 1020;
}


/* 全屏中央内容区 */
.fullscreen-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}


/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
