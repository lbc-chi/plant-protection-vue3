<template>
  <div class="pest-topic-page">
    <LoadingSpinner v-if="loading" size="large" text="加载虫害专题数据..." :overlay="true" :skeleton="true" />

    <div v-else class="pest-layout">

      <!-- ===== 顶部导航栏 ===== -->
      <PageHeader
        active-nav="pest"
        current-page="pest"
        @menu-toggle="toggleMenuDrawer"
      />

      <!-- ===== 三栏主体布局 ===== -->
      <div class="main-body">
        <!-- ===== 左侧面板：走廊数据采集量 + 历史对比 + 数据概览 ===== -->
        <aside class="left-panel">
          <PestLeftPanel />
        </aside>

        <!-- ===== 中央区域：地图+时间轴+弹窗 ===== -->
        <main class="center-panel">
          <PestCenterMap />
        </main>

        <!-- ===== 右侧面板：气象叠加分析 + 数据对比 + 预警图片 ===== -->
        <aside class="right-panel">
          <PestRightPanel />
        </aside>
      </div>
    </div>

    <!-- 菜单抽屉弹框 -->
    <MenuDrawer
      v-model="isMenuDrawerOpen"
      @menu-select="handleMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import PestLeftPanel from './pest/PestLeftPanel.vue'
import PestCenterMap from './pest/PestCenterMap.vue'
import PestRightPanel from './pest/PestRightPanel.vue'
import MenuDrawer from '@/components/business/MenuDrawer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

const loading = ref(true)
const isMenuDrawerOpen = ref(false)

function toggleMenuDrawer() {
  isMenuDrawerOpen.value = !isMenuDrawerOpen.value
}

function handleMenuSelect(_item: string) {}

onMounted(() => {
  setTimeout(() => { loading.value = false }, 600)
})
</script>

<style scoped>
.pest-topic-page {
  width: 100%;
  height: 100vh;
  background: var(--bg-page);
  overflow: hidden;
  color: var(--text-primary);
  position: relative;
  font-family: var(--font-sans);
}

.pest-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-body {
  flex: 1;
  display: grid;
  grid-template-columns: 360px 1fr 400px;
  gap: var(--sp-lg);
  padding: var(--sp-md) var(--sp-lg) var(--sp-sm);
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

.left-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  align-self: stretch;
}

.center-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  align-self: stretch;
}

.right-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  align-self: stretch;
}

@media(max-width: 1600px) {
  .main-body {
    grid-template-columns: 320px 1fr 360px;
    gap: var(--sp-md);
    padding: var(--sp-sm) var(--sp-md) var(--sp-xs);
  }
}

@media(max-width: 1366px) {
  .main-body {
    grid-template-columns: 280px 1fr 320px;
    gap: var(--sp-sm);
    padding: var(--sp-xs) var(--sp-sm) var(--sp-xs);
  }
}
</style>
