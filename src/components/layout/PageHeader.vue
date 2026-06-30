<template>
  <header class="proto-header">
    <div class="header-left">
      <div class="weather-box">
        <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          <circle cx="12" cy="12" r="5"/>
        </svg>
        <span class="weather-temp">17~28°C</span>
        <span class="weather-desc">多云</span>
      </div>
      <button class="menu-btn" title="打开菜单" @click="toggleMenuDrawer">
        <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <nav class="main-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-chip"
          :class="{ 'nav-chip--active': item.key === activeNav }"
          @click="handleNavClick(item.key)"
        >{{ item.label }}</button>
      </nav>
    </div>

    <div class="header-center">
      <h1 class="platform-title">
        <span class="title-deco"></span>
        山东省智慧植保综合指挥平台
        <span class="title-deco"></span>
      </h1>
    </div>

    <div class="header-right">
      <div class="datetime-box">
        <span class="dt-weekday">{{ weekday }}</span>
        <span class="dt-time number-font">{{ currentTime }}</span>
        <span class="dt-date number-font">{{ currentDate }}</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" title="全屏" @click="toggleFullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
          </svg>
        </button>
        <template v-if="showExtraActions">
          <button class="icon-btn" title="设置" @click="handleSettings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
          <button class="icon-btn" title="分享" @click="handleShare">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98"/>
            </svg>
          </button>
        </template>
        <template v-else>
          <button class="icon-btn" title="返回首页" @click="goHome">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAppHeader } from '@/composables/useAppHeader'
import { useNavigation } from '@/composables/useNavigation'

const props = withDefaults(defineProps<{
  activeNav: string
  currentPage: string
  showExtraActions?: boolean
}>(), {
  showExtraActions: true
})

const emit = defineEmits<{
  'menu-toggle': []
}>()

const { weekday, currentTime, currentDate, toggleFullscreen, handleSettings, handleShare } = useAppHeader()
const { navItems, handleNavClick } = useNavigation(props.currentPage)

function toggleMenuDrawer() {
  emit('menu-toggle')
}

function goHome() {
  handleNavClick('home')
}
</script>

<style scoped>
.proto-header {
  height: var(--header-height);
  min-height: var(--header-height);
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 360px 1fr 400px;
  align-items: center;
  padding: 0 var(--sp-xl);
  background: var(--bg-header);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border-glow-outer);
  box-shadow: var(--shadow-header);
  position: relative;
  z-index: var(--z-header);
}

.proto-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary-glow), transparent);
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
}

.weather-box {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  padding: var(--sp-xs) var(--sp-md);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.weather-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent-warm);
}

.weather-temp {
  font-weight: 600;
  color: var(--color-accent-warm);
  font-family: var(--font-number);
}

.weather-desc {
  color: var(--text-secondary);
}

.menu-btn {
  width: 36px;
  height: 36px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.menu-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--border-glow-active);
  box-shadow: var(--shadow-glow);
}

.menu-icon {
  width: 20px;
  height: 20px;
}

.main-nav {
  display: flex;
  gap: var(--sp-xs);
}

.nav-chip {
  padding: 6px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 500;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--transition-smooth);
  white-space: nowrap;
}

.nav-chip:hover {
  color: var(--color-primary);
  border-color: var(--glass-border-hover);
  background: var(--glass-bg-hover);
  transform: translateY(-1px);
}

.nav-chip--active {
  background: linear-gradient(135deg, rgba(47, 111, 159, .25), rgba(47, 111, 159, .18));
  border-color: var(--border-glow-active);
  color: #fff;
  font-weight: 700;
  box-shadow: var(--shadow-glow), inset 0 0 10px rgba(47, 111, 159, .08);
}

.header-center {
  text-align: center;
}

.platform-title {
  margin: 0;
  font-size: var(--fs-2xl);
  font-weight: 800;
  font-family: var(--font-sans);
  letter-spacing: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-lg);
  background: linear-gradient(135deg, #4A8FBF 0%, #2F6F9F 50%, #4A8FBF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 16px rgba(47, 111, 159, 0.4));
}

.title-deco {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  border-radius: 1px;
  opacity: .6;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-md);
}

.header-actions {
  display: flex;
  gap: var(--sp-xs);
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.icon-btn:hover {
  border-color: var(--border-glow-active);
  background: var(--glass-bg-hover);
  box-shadow: var(--shadow-glow);
  transform: scale(1.06);
}

.icon-btn:hover svg {
  color: var(--color-primary);
}

.datetime-box {
  display: flex;
  align-items: baseline;
  gap: var(--sp-sm);
  padding: var(--sp-xs) var(--sp-md);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.dt-weekday {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  font-weight: 500;
  font-family: var(--font-sans);
}

.dt-time {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text-accent);
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(47, 111, 159, .35);
}

.dt-date {
  font-size: var(--fs-xs);
  color: var(--text-dim);
}

@media(max-width: 1600px) {
  .proto-header {
    grid-template-columns: 320px 1fr 360px;
    padding: 0 var(--sp-lg);
  }
  .platform-title { font-size: var(--fs-lg); letter-spacing: 3px; }
  .title-deco { width: 32px; }
}

@media(max-width: 1366px) {
  .proto-header {
    grid-template-columns: 280px 1fr 320px;
  }
  .platform-title { font-size: var(--fs-md); letter-spacing: 2px; }
  .title-deco { width: 28px; }
}
</style>