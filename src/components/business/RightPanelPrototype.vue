<template>
  <aside class="prototype-right-panel">
    <div class="panel-scroll">
      <!-- 植保工程建设成果 -->
      <div class="construction-section">
        <div class="section-header">
          <span class="section-bar"></span>
          <h2 class="section-title">植保工程建设成果</h2>
        </div>
        <div class="gauge-grid">
          <div
            v-for="item in gaugeItems"
            :key="item.key"
            class="gauge-card"
            @click.stop="emit('gauge-click', item)"
          >
            <!-- 双层圆环图标 -->
            <div class="gauge-ring" :style="{ borderColor: item.ringColor }">
              <div class="gauge-ring__inner" :style="{ background: item.ringBg }">
                <span class="gauge-icon">{{ item.icon }}</span>
              </div>
            </div>
            <!-- 文字内容 -->
            <div class="gauge-text">
              <div class="gauge-label">{{ item.label }}</div>
              <div class="gauge-value-row">
                <span class="gauge-value">{{ animatedValues[item.key] ?? item.value }}</span>
                <span v-if="item.change !== null" class="gauge-trend" :class="item.change > 0 ? 'trend-up' : 'trend-down'">
                  <span class="trend-arrow">{{ item.change > 0 ? '↑' : '↓' }}</span>{{ Math.abs(item.change) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 测报灯---采集数据 -->
      <GlassCard title="测报灯---采集数据" icon="💡" class="carousel-section" :animate="true" :animate-delay="120" glow hud-corners>
        <div class="image-demo-container">
          <div class="image-demo-frame">
            <svg class="frame-svg" viewBox="0 0 200 130" preserveAspectRatio="none">
              <path d="M12,2 L188,2 L198,18 L198,112 L188,128 L12,128 L2,112 L2,18 Z"
                fill="none" stroke="rgba(47, 111, 159,.45)" stroke-width="1.2"/>
              <path d="M14,4 L186,4 L196,16 L196,114 L186,126 L14,126 L4,114 L4,16 Z"
                fill="none" stroke="rgba(47, 111, 159,.15)" stroke-width="0.6"/>
              <path d="M10,2 L22,2 L12,14 Z" fill="rgba(47, 111, 159,.25)"/>
              <path d="M190,2 L178,2 L188,14 Z" fill="rgba(47, 111, 159,.25)"/>
              <path d="M190,128 L178,128 L188,116 Z" fill="rgba(47, 111, 159,.25)"/>
              <path d="M10,128 L22,128 L12,116 Z" fill="rgba(47, 111, 159,.25)"/>
            </svg>
            <img src="/images/trap-light-demo.jpg" alt="测报灯采集数据" class="demo-img" />
          </div>
          <div class="image-info-bar">
            <span class="info-label">测报灯农田夜间采集作业</span>
          </div>
        </div>
      </GlassCard>

      <!-- 多光谱---采集数据 -->
      <GlassCard title="多光谱---采集数据" icon="🔬" class="carousel-section" :animate="true" :animate-delay="240" glow hud-corners>
        <div class="image-demo-container">
          <div class="image-demo-frame image-demo-frame--crop">
            <svg class="frame-svg" viewBox="0 0 200 130" preserveAspectRatio="none">
              <path d="M12,2 L188,2 L198,18 L198,112 L188,128 L12,128 L2,112 L2,18 Z"
                fill="none" stroke="rgba(236,72,153,.4)" stroke-width="1.2"/>
              <path d="M14,4 L186,4 L196,16 L196,114 L186,126 L14,126 L4,114 L4,16 Z"
                fill="none" stroke="rgba(236,72,153,.12)" stroke-width="0.6"/>
              <path d="M10,2 L22,2 L12,14 Z" fill="rgba(236,72,153,.2)"/>
              <path d="M190,2 L178,2 L188,14 Z" fill="rgba(236,72,153,.2)"/>
              <path d="M190,128 L178,128 L188,116 Z" fill="rgba(236,72,153,.2)"/>
              <path d="M10,128 L22,128 L12,116 Z" fill="rgba(236,72,153,.2)"/>
            </svg>
            <img src="/images/multi-spectral-demo.jpg" alt="多光谱采集数据" class="demo-img" />
          </div>
          <div class="image-info-bar">
            <span class="info-label info-label--pink">多光谱遥感植被监测分析</span>
          </div>
        </div>
      </GlassCard>

    </div>
  </aside>
</template>

<script setup lang="ts">
import { CONSTRUCTION_STATS, type ConstructionStat } from '@/constants/mockData'
import { reactive, onMounted } from 'vue'
import GlassCard from '@/components/ui/GlassCard.vue'

interface GaugeItem {
  key: string
  icon: string
  label: string
  value: number | string
  change: number | null
  unit?: string
  ringColor: string
  ringBg: string
}

const emit = defineEmits<{
  (e: 'gauge-click', item: GaugeItem): void
}>()

// 使用标准化 mock 数据
const gaugeItems: GaugeItem[] = CONSTRUCTION_STATS.map((s: ConstructionStat) => ({
  key: s.key,
  icon: s.icon,
  label: s.label,
  value: String(s.value),
  change: s.trend,
  ringColor: s.ringColor.replace(/[\d.]+\)$/, '0.6)'),
  ringBg: s.ringBg
}))

const animatedValues = reactive<Record<string, number | string>>({})

// ===== 动画 & 生命周期 =====
function animateGaugeValue(key: string, target: number | string) {
  if (typeof target === 'string') { animatedValues[key] = target; return }
  const startTime = Date.now()
  const duration = 900
  function tick() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 4)
    animatedValues[key] = Math.round((target as number) * ease)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function handleGaugeClick(item: GaugeItem) {
  emit('gauge-click', item)
}

onMounted(() => {
  gaugeItems.forEach((item, idx) => {
    setTimeout(() => animateGaugeValue(item.key, item.value), 200 + idx * 120)
  })
})
</script>

<style scoped>
.prototype-right-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.panel-scroll {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== 植保工程建设成果 - 原型图风格卡片 (3x2 横排) ===== */
.construction-section {
  flex-shrink: 0;
  margin-bottom: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-left: 2px;
}

.section-bar {
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #FACC15 0%, #FFA500 100%);
  border-radius: 2px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #FACC15;
  letter-spacing: 1px;
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.gauge-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(47, 111, 159, 0.28);
  border-radius: 4px;
  cursor: pointer;
}

/* 双层圆环图标 */
.gauge-ring {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.gauge-ring__inner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge-icon {
  font-size: 12px;
  line-height: 1;
}

/* 文字内容 */
.gauge-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.gauge-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
  line-height: 1.2;
}

.gauge-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.2;
}

.gauge-value {
  font-size: 15px;
  font-weight: 800;
  color: #FACC15;
  font-family: var(--font-number);
  font-variant-numeric: tabular-nums;
}

.gauge-trend {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-number);
  line-height: 1.2;
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
}

.trend-arrow {
  font-size: 9px;
}

.trend-up   { color: #52C41A; }
.trend-down { color: #FF4444; }

/* ===== 演示图片展示容器（替换原有轮播） ===== */
.carousel-section {
  flex: 1;
  min-height: 0;
}

.image-demo-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 6px;
}

.image-demo-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(6,20,32,0.95), rgba(8,28,40,0.92));
}

.image-demo-frame--crop .frame-svg path:nth-child(2) { stroke: rgba(236,72,153,0.4); }
.image-demo-frame--crop .frame-svg path:nth-child(n+3) { fill: rgba(236,72,153,0.2); }

.frame-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.demo-img {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  object-fit: cover;
  border-radius: 3px;
  display: block;
}

/* 信息栏 */
.image-info-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: #7dd3fc;
  letter-spacing: 0.5px;
  font-family: var(--font-sans);
}

.info-label--pink { color: #f9a8d4; }
</style>
