<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="menu-drawer-overlay" @click.self="handleClose">
        <!-- 抽屉主体 -->
        <aside class="menu-drawer" :class="{ 'menu-drawer--open': modelValue }">

          <!-- 标题栏 -->
          <div class="drawer-header">
            <div class="header-left-content">
              <span class="drawer-icon">🌿</span>
              <h2 class="drawer-title">山东植保</h2>
            </div>
            <button class="close-btn" @click="handleClose" title="关闭菜单">✕</button>
          </div>

          <!-- 菜单滚动区域 -->
          <nav class="drawer-menu-scroll">

            <!-- 数据仪表盘 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('dashboard')">
                <span class="group-icon">📊</span>
                <span class="group-name">数据仪表盘</span>
                <span class="group-arrow">{{ expandedGroups.includes('dashboard') ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- 光谱资源列表 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('spectrum')">
                <span class="group-icon">🌈</span>
                <span class="group-name">光谱资源列表</span>
                <span class="group-arrow">{{ expandedGroups.includes('spectrum') ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- 专题分析 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('topic')">
                <span class="group-icon">🔬</span>
                <span class="group-name">专题分析</span>
                <span class="group-arrow">{{ expandedGroups.includes('topic') ? '▼' : '▶' }}</span>
              </div>
              <div v-if="expandedGroups.includes('topic')" class="sub-menu">
                <div class="sub-item" @click="toggleSubGroup('manualTask')">
                  <span class="sub-arrow">{{ expandedSubGroups.includes('manualTask') ? '▼' : '▶' }}</span>
                  <span>人工测报任务汇总</span>
                </div>
                <div v-if="expandedSubGroups.includes('manualTask')" class="sub-sub-menu">
                  <div class="sub-sub-item" @click="selectMenuItem('人工测报数据专题')">人工测报数据专题</div>
                  <div class="sub-sub-item sub-sub-item--active" @click="selectMenuItem('赤霉病专题')">
                    <span class="active-dot"></span>赤霉病专题
                  </div>
                  <div class="sub-sub-item" @click="selectMenuItem('条锈病专题')">条锈病专题</div>
                </div>
                <div class="sub-item" @click="selectMenuItem('人工测报数据专题')">
                  <span class="sub-arrow">▶</span>
                  <span>人工测报数据专题</span>
                </div>
              </div>
            </div>

            <!-- 多维分析 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('analysis')">
                <span class="group-icon">📈</span>
                <span class="group-name">多维分析</span>
                <span class="group-arrow">{{ expandedGroups.includes('analysis') ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- 综合查询 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('query')">
                <span class="group-icon">🔍</span>
                <span class="group-name">综合查询</span>
                <span class="group-arrow">{{ expandedGroups.includes('query') ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- 病虫情报汇集 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="selectMenuItem('病虫情报汇集')">
                <span class="group-icon">🐛</span>
                <span class="group-name">病虫情报汇集</span>
              </div>
            </div>

            <!-- 知识库资源 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('knowledge')">
                <span class="group-icon">📚</span>
                <span class="group-name">知识库资源</span>
                <span class="group-arrow">{{ expandedGroups.includes('knowledge') ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- 视频监控 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="selectMenuItem('视频监控')">
                <span class="group-icon">📹</span>
                <span class="group-name">视频监控</span>
              </div>
            </div>

            <!-- 市县专题 -->
            <div class="menu-group">
              <div class="menu-group-header" @click="toggleGroup('cityTopic')">
                <span class="group-icon">🏙️</span>
                <span class="group-name">市县专题</span>
                <span class="group-arrow">{{ expandedGroups.includes('cityTopic') ? '▼' : '▶' }}</span>
              </div>
              <div v-if="expandedGroups.includes('cityTopic')" class="sub-menu">
                <div class="sub-item sub-item--active" @click="selectMenuItem('玉米情-98')">
                  <span class="active-dot"></span>玉米情-98
                </div>
                <div class="sub-item" @click="selectMenuItem('粘虫-98')">
                  粘虫-98
                </div>
              </div>
            </div>

          </nav>

          <!-- 底部装饰 -->
          <div class="drawer-footer">
            <div class="footer-line"></div>
            <span class="footer-text">智慧植保指挥平台 v3.0</span>
          </div>

        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  /** 控制弹框显示/隐藏 */
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'menu-select', item: string): void
}>()

// ========== 菜单展开状态管理 ==========
const expandedGroups = ref<string[]>(['topic'])
const expandedSubGroups = ref<string[]>(['manualTask'])

function toggleGroup(groupName: string) {
  const index = expandedGroups.value.indexOf(groupName)
  if (index > -1) {
    expandedGroups.value.splice(index, 1)
  } else {
    expandedGroups.value.push(groupName)
  }
}

function toggleSubGroup(subGroupName: string) {
  const index = expandedSubGroups.value.indexOf(subGroupName)
  if (index > -1) {
    expandedSubGroups.value.splice(index, 1)
  } else {
    expandedSubGroups.value.push(subGroupName)
  }
}

function selectMenuItem(item: string) {
  console.log('[MenuDrawer] 📌 选择菜单项:', item)
  emit('menu-select', item)
  // 选择后自动关闭弹框
  handleClose()
}

/** 关闭弹框 */
function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* ===== 遮罩层 ===== */
.menu-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
}

/* ===== 抽屉主体 ===== */
.menu-drawer {
  width: 280px;
  height: 100%;
  background: linear-gradient(180deg, rgba(8, 32, 50, 0.98), rgba(6, 24, 38, 0.96));
  border-right: 1px solid rgba(47, 111, 159, 0.2);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 标题栏 ===== */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(90deg, rgba(47, 111, 159, 0.15), transparent 70%);
  border-bottom: 1px solid rgba(47, 111, 159, 0.2);
  position: relative;
}

.drawer-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47, 111, 159, 0.6), transparent);
}

.header-left-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-icon {
  font-size: 22px;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #00ffd4;
  letter-spacing: 2px;
  text-shadow: 0 0 14px rgba(47, 111, 159, 0.5);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(47, 111, 159, 0.3);
  border-radius: 8px;
  color: #2F6F9F;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 15px;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.45);
  color: #f87171;
  transform: rotate(90deg);
}

/* ===== 菜单滚动区域 ===== */
.drawer-menu-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(47, 111, 159, 0.15) transparent;
}

.drawer-menu-scroll::-webkit-scrollbar { width: 4px; }
.drawer-menu-scroll::-webkit-scrollbar-thumb { background: rgba(47, 111, 159, 0.15); border-radius: 2px; }

/* ===== 菜单组 ===== */
.menu-group {
  margin-bottom: 2px;
}

.menu-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  border-left: 3px solid transparent;
}

.menu-group-header:hover {
  background: linear-gradient(90deg, rgba(47, 111, 159, 0.1), transparent 60%);
  border-left-color: rgba(47, 111, 159, 0.55);
}

.group-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.group-name {
  flex: 1;
  font-size: 14px;
  color: #c8e6f0;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.group-arrow {
  font-size: 11px;
  color: #5a8a9a;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

/* ===== 子菜单 ===== */
.sub-menu {
  padding-left: 30px;
  background: rgba(0, 20, 35, 0.35);
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #8ecacc;
  border-left: 2px solid transparent;
}

.sub-item:hover {
  background: rgba(47, 111, 159, 0.08);
  border-left-color: rgba(47, 111, 159, 0.45);
  color: #2F6F9F;
}

.sub-item--active {
  background: rgba(47, 111, 159, 0.12);
  border-left-color: #2F6F9F;
  color: #2F6F9F;
  font-weight: 600;
}

.sub-arrow {
  font-size: 9px;
  color: #5a8a9a;
  width: 12px;
  text-align: center;
  flex-shrink: 0;
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2F6F9F;
  box-shadow: 0 0 7px rgba(47, 111, 159, 0.65);
  flex-shrink: 0;
}

/* ===== 子子菜单 ===== */
.sub-sub-menu {
  padding-left: 18px;
  background: rgba(0, 15, 28, 0.45);
}

.sub-sub-item {
  padding: 8px 14px 8px 22px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12.5px;
  color: #7db8ca;
  border-left: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-sub-item:hover {
  background: rgba(47, 111, 159, 0.05);
  border-left-color: rgba(47, 111, 159, 0.35);
  color: #9edbd0;
}

.sub-sub-item--active {
  background: linear-gradient(90deg, rgba(47, 111, 159, 0.14), transparent);
  border-left-color: #2F6F9F;
  color: #2F6F9F;
  font-weight: 600;
}

/* ===== 底部装饰 ===== */
.drawer-footer {
  padding: 14px 20px;
  text-align: center;
  border-top: 1px solid rgba(47, 111, 159, 0.1);
  background: rgba(0, 15, 28, 0.3);
}

.footer-line {
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47, 111, 159, 0.3), transparent);
  margin: 0 auto 8px;
}

.footer-text {
  font-size: 11px;
  color: #4a7888;
  letter-spacing: 1px;
}

/* ===== 过渡动画 ===== */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .menu-drawer,
.drawer-leave-active .menu-drawer {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .menu-drawer,
.drawer-leave-to .menu-drawer {
  transform: translateX(-100%);
}

.drawer-enter-to .menu-drawer,
.drawer-leave-from .menu-drawer {
  transform: translateX(0);
}
</style>
