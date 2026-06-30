<template>
  <header class="app-header">
    <!-- ===== 左侧：菜单按钮 + 天气信息区域 ===== -->
    <div class="header-left">
      <!-- 三条杠菜单切换按钮 -->
      <button
        class="menu-toggle-btn"
        :class="{ 'menu-toggle-btn--active': showMenuDrawer }"
        @click="handleMenuToggle"
        title="打开菜单"
      >
        <span class="hamburger-icon">☰</span>
      </button>

      <!-- 天气信息 -->
      <div class="weather-info">
        <!-- 天气图标 -->
        <span class="weather-icon" :title="weather.description">
          {{ weatherIcon }}
        </span>

        <!-- 温度范围 -->
        <span class="temperature">
          {{ weather.tempMin }}~{{ weather.tempMax }}°C
        </span>

        <!-- 天气状况 -->
        <span class="weather-desc">{{ weather.description }}</span>
      </div>
    </div>

    <!-- ===== 中间：平台标题 + 时间显示 ===== -->
    <div class="header-center">
      <!-- 平台标题（可选，通过 prop 控制）-->
      <h1 v-if="showTitle" class="platform-title">
        {{ title }}
      </h1>

      <!-- 日期时间显示 -->
      <div class="datetime-display">
        <!-- 日期部分 -->
        <div class="date-section">
          <span class="year">{{ formattedDate.year }}</span>
          <span class="date-separator">.</span>
          <span class="month">{{ formattedDate.month }}</span>
          <span class="date-separator">.</span>
          <span class="day">{{ formattedDate.day }}</span>
        </div>

        <!-- 时间部分 -->
        <div class="time-section">
          <span class="time-value">{{ formattedTime }}</span>
        </div>

        <!-- 星期几 -->
        <div class="weekday-section">
          <span class="weekday">{{ weekdayText }}</span>
        </div>
      </div>
    </div>

    <!-- ===== 右侧：导航菜单 ===== -->
    <nav class="header-right">
      <ul class="nav-menu">
        <li
          v-for="(item, index) in navItems"
          :key="item.key"
          :class="['nav-item', { 'nav-item--active': activeNav === item.key }]"
          @click="handleNavClick(item)"
        >
          <span class="nav-item__icon" v-if="item.icon">{{ item.icon }}</span>
          <span class="nav-item__label">{{ item.label }}</span>
          
          <!-- 激活指示器 -->
          <span v-if="activeNav === item.key" class="nav-item__indicator"></span>
        </li>
      </ul>

      <!-- 可选的额外操作按钮区 -->
      <div v-if="$slots.actions" class="header-actions">
        <slot name="actions"></slot>
      </div>
    </nav>
  </header>

  <!-- 菜单抽屉弹框 -->
  <MenuDrawer
    v-model="showMenuDrawer"
    @menu-select="handleMenuSelect"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import MenuDrawer from '@/components/business/MenuDrawer.vue'

// 设置 dayjs 中文 locale
dayjs.locale('zh-cn')

// ============================================
// 类型定义
// ============================================

interface WeatherData {
  tempMin: number
  tempMax: number
  description: string
  icon?: string
}

interface NavItem {
  key: string
  label: string
  icon?: string
  route?: string
}

// ============================================
// Props 定义
// ============================================

interface Props {
  /** 平台标题 */
  title?: string
  /** 是否显示标题 */
  showTitle?: boolean
  /** 当前激活的导航项 key */
  defaultActiveNav?: string
  /** 天气数据（可选，不传则使用默认值） */
  weather?: Partial<WeatherData>
  /** 导航菜单项 */
  navItems?: NavItem[]
  /** 时间更新间隔（毫秒），默认 1000ms */
  updateInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '山东省智慧植保综合指挥平台',
  showTitle: true,
  defaultActiveNav: 'home',
  weather: () => ({}),
  navItems: () => [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'pest', label: '虫害专题', icon: '🐛' },
    { key: 'stations', label: '站点分布', icon: '📍' }
  ],
  updateInterval: 1000
})

// ============================================
// Emits 定义
// ============================================

const emit = defineEmits<{
  (e: 'navChange', item: NavItem): void
  (e: 'timeUpdate', time: string): void
  (e: 'panelToggle', isExpanded: boolean): void
}>()

// ============================================
// 响应式状态
// ============================================

/** 当前时间 */
const currentTime = ref(dayjs())

/** 当前激活的导航项 */
const activeNav = ref(props.defaultActiveNav)

/** 菜单抽屉显示状态 */
const showMenuDrawer = ref(false)

/** 定时器 ID */
let timerId: ReturnType<typeof setInterval> | null = null

// ============================================
// 计算属性
// ============================================

/** 格式化的日期对象 */
const formattedDate = computed(() => ({
  year: currentTime.value.format('YYYY'),
  month: currentTime.value.format('MM'),
  day: currentTime.value.format('DD')
}))

/** 格式化的时间字符串 HH:mm:ss */
const formattedTime = computed(() => currentTime.value.format('HH:mm:ss'))

/** 星期几文本 */
const weekdayText = computed(() => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[currentTime.value.day()]
})

/** 完整的日期时间字符串（备用）*/
const fullDateTime = computed(() =>
  currentTime.value.format('YYYY.MM.DD HH:mm:ss')
)

/** 天气数据（合并默认值）*/
const weather = computed<WeatherData>(() => ({
  tempMin: props.weather.tempMin ?? 17,
  tempMax: props.weather.tempMax ?? 28,
  description: props.weather.description ?? '多云',
  icon: props.weather.icon
}))

/** 天气图标映射 */
const weatherIcon = computed(() => {
  const iconMap: Record<string, string> = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌧️',
    '中雨': '🌧️',
    '大雨': '⛈️',
    '雪': '❄️',
    '雾': '🌫️'
  }
  
  return weather.value.icon || iconMap[weather.value.description] || '🌤️'
})

// ============================================
// 方法
// ============================================

/** 更新当前时间 */
function updateTime() {
  currentTime.value = dayjs()
  emit('timeUpdate', fullDateTime.value)
}

/** 处理导航点击 */
function handleNavClick(item: NavItem) {
  activeNav.value = item.key

  // 如果有路由配置，进行路由跳转
  if (item.route && typeof window !== 'undefined') {
    // 这里可以集成 vue-router，示例：
    // router.push(item.route)
    console.log('[Header] Navigate to:', item.route)
  }

  emit('navChange', item)
}

/** 处理左侧面板切换 */
function handleMenuToggle() {
  showMenuDrawer.value = !showMenuDrawer.value
  console.log(`[Header] ☰ 菜单抽屉${showMenuDrawer.value ? '打开' : '关闭'}`)
}

/** 处理菜单项选择 */
function handleMenuSelect(item: string) {
  console.log('[Header] 📌 菜单项选择:', item)
}

/** 启动定时器 */
function startTimer() {
  stopTimer() // 先清除已有的定时器
  timerId = setInterval(updateTime, props.updateInterval)
}

/** 停止定时器 */
function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  // 初始化时间
  updateTime()

  // 启动定时器
  startTimer()

  console.log('[Header] 🎉 组件已挂载，时间更新已启动')
})

onUnmounted(() => {
  // 清理定时器，防止内存泄漏
  stopTimer()
  console.log('[Header] 🧹 组件卸载，定时器已清理')
})

// ============================================
// 暴露给父组件的方法/属性
// ============================================

defineExpose({
  /** 获取当前完整时间 */
  getFullTime: () => fullDateTime.value,
  /** 手动刷新时间 */
  refreshTime: updateTime,
  /** 切换导航项 */
  setActiveNav: (key: string) => {
    activeNav.value = key
  },
  /** 获取当前激活导航 */
  getActiveNav: () => activeNav.value,
  /** 打开菜单抽屉 */
  openMenuDrawer: () => { showMenuDrawer.value = true },
  /** 关闭菜单抽屉 */
  closeMenuDrawer: () => { showMenuDrawer.value = false }
})
</script>

<style scoped>
/* ============================================
 * Header 组件样式
 * 遵循 Design Token 规范（橙金暗色主题）
 * ============================================ */

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 56px);
  padding: 0 var(--space-6, 24px);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.98),
    rgba(20, 30, 50, 0.95)
  );
  border-bottom: 1px solid var(--border-default, rgba(245, 158, 11, 0.18));
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(245, 158, 11, 0.08);
  position: relative;
  z-index: var(--z-sticky, 1020);
  backdrop-filter: blur(10px);
  user-select: none;
}

/* ===== 左侧：菜单按钮 + 天气信息 ===== */

.header-left {
  flex-shrink: 0;
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
}

/* 三条杠菜单切换按钮 */
.menu-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-base, 6px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.menu-toggle-btn:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.45);
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}

.menu-toggle-btn--active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(255, 107, 53, 0.15));
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow:
    0 0 16px rgba(245, 158, 11, 0.3),
    inset 0 0 8px rgba(251, 191, 36, 0.1);
}

.menu-toggle-btn--active:hover {
  box-shadow:
    0 0 20px rgba(245, 158, 11, 0.4),
    inset 0 0 10px rgba(251, 191, 36, 0.15);
}

.hamburger-icon {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-accent, #facc15);
  line-height: 1;
  filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.4));
  transition: transform 0.3s ease;
}

.menu-toggle-btn:hover .hamburger-icon {
  transform: scale(1.1);
}

.menu-toggle-btn--active .hamburger-icon {
  filter: drop-shadow(0 0 8px rgba(47, 111, 159, 0.4));
}

.weather-info {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  font-size: var(--text-sm, 14px);
  color: var(--text-secondary, #cbd5e1);
}

.weather-icon {
  font-size: 20px;
  line-height: 1;
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3));
  animation: weatherFloat 3s ease-in-out infinite;
}

@keyframes weatherFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.temperature {
  font-weight: var(--font-semibold, 600);
  color: var(--color-accent, #facc15);
  letter-spacing: -0.3px;
}

.weather-desc {
  color: var(--text-tertiary, #94a3b8);
  font-size: var(--text-xs, 12px);
}

/* ===== 中间：标题 + 时间 ===== */

.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.platform-title {
  margin: 0;
  font-size: var(--text-xl, 24px);
  font-weight: var(--font-bold, 700);
  color: var(--text-primary, #f1f5f9);
  letter-spacing: var(--tracking-wide, 0.05em);
  text-shadow: 
    0 0 10px rgba(245, 158, 11, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.datetime-display {
  display: flex;
  align-items: baseline;
  gap: var(--space-3, 12px);
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: var(--text-sm, 14px);
}

.date-section {
  display: flex;
  align-items: baseline;
  gap: 1px;
  color: var(--text-secondary, #cbd5e1);
}

.date-section .year,
.date-section .month,
.date-section .day {
  font-weight: var(--font-medium, 500);
  transition: color var(--duration-200, 200ms);
}

.date-section:hover .year,
.date-section:hover .month,
.date-section:hover .day {
  color: var(--color-primary, #f59e0b);
}

.date-separator {
  color: var(--text-muted, #64748b);
  margin: 0 1px;
}

.time-section {
  position: relative;
}

.time-value {
  font-size: var(--text-md, 18px);
  font-weight: var(--font-bold, 700);
  color: var(--color-accent, #facc15);
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.06);
  border-radius: var(--radius-base, 6px);
  border: 1px solid rgba(245, 158, 11, 0.15);
  transition: all var(--duration-200, 200ms);
}

.time-value:hover {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  transform: scale(1.02);
}

.weekday-section {
  font-size: var(--text-xs, 12px);
  color: var(--text-tertiary, #94a3b8);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm, 4px);
}

/* ===== 右侧：导航菜单 ===== */

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
}

.nav-menu {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--space-1, 4px);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1, 4px);
  padding: var(--space-2, 8px) var(--space-4, 16px);
  cursor: pointer;
  border-radius: var(--radius-base, 6px);
  font-size: var(--text-sm, 14px);
  font-weight: var(--font-medium, 500);
  color: var(--text-secondary, #cbd5e1);
  background: transparent;
  border: 1px solid transparent;
  transition: all var(--duration-200, 200ms) var(--ease-out);
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--color-accent, #facc15);
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
  transform: translateY(-1px);
}

/* 激活状态 */
.nav-item--active {
  color: var(--color-accent, #facc15);
  background: linear-gradient(
    135deg,
    rgba(250, 204, 21, 0.12),
    rgba(255, 107, 53, 0.08)
  );
  border-color: rgba(250, 204, 21, 0.35);
  box-shadow: 
    0 0 12px rgba(245, 158, 11, 0.15),
    inset 0 0 8px rgba(251, 191, 36, 0.05);
}

.nav-item--active:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 0 16px rgba(245, 158, 11, 0.25),
    inset 0 0 10px rgba(251, 191, 36, 0.08);
}

.nav-item__icon {
  font-size: 16px;
  line-height: 1;
  filter: drop-shadow(0 0 2px currentColor);
}

.nav-item__label {
  letter-spacing: var(--tracking-tight, -0.025em);
}

/* 激活指示器（底部横线）*/
.nav-item__indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-accent, #facc15),
    transparent
  );
  border-radius: var(--radius-full, 9999px);
  opacity: 0.75;
  width: 70%;
  filter: blur(1px);
  box-shadow: 0 0 8px var(--color-accent, #facc15);
}

/* 操作按钮区域 */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding-left: var(--space-3, 12px);
  border-left: 1px solid var(--border-subtle, rgba(245, 158, 11, 0.1));
}

/* ============================================
 * 响应式适配
 * ============================================ */

@media (max-width: 1024px) {
  .app-header {
    padding: 0 var(--space-4, 16px);
  }

  .header-center {
    position: static;
    transform: none;
    order: -1; /* 移到最前面 */
  }

  .platform-title {
    font-size: var(--text-lg, 20px);
  }

  .datetime-display {
    font-size: var(--text-xs, 12px);
    gap: var(--space-2, 8px);
  }

  .time-value {
    font-size: var(--text-base, 16px);
  }

  .nav-menu {
    gap: 2px;
  }

  .nav-item {
    padding: var(--space-1, 4px) var(--space-3, 12px);
    font-size: var(--text-xs, 12px);
  }

  .nav-item__icon {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .header-left {
    min-width: auto;
  }

  .weather-info {
    font-size: var(--text-xs, 12px);
    gap: var(--space-1, 4px);
  }

  .weather-icon {
    font-size: 16px;
  }

  .platform-title {
    display: none; /* 小屏隐藏标题 */
  }

  .nav-item__label {
    /* 超小屏只显示图标 */
  }

  .weekday-section {
    display: none;
  }
}

/* ============================================
 * 动画与过渡效果
 * ============================================ */

/* 时间数字翻转效果（可选增强）*/
.time-value::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 50%
  );
  pointer-events: none;
  border-radius: inherit;
}

/* 导航项点击波纹效果 */
.nav-item:active {
  transform: scale(0.97);
}

/* 天气图标 — 持续柔和光晕，无闪烁 */
.weather-icon {
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.35));
}

</style>
