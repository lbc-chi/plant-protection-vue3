<template>
  <div
    ref="cardRef"
    class="glass-card"
    :class="{
      'glass-card--hoverable': hoverable,
      'glass-card--bordered': bordered,
      'glass-card--no-padding': noPadding,
      'glass-card--glow': glow,
      'glass-card--scanline': scanline,
      'glass-card--sweep': sweep,
      'glass-card--neon': neon,
      'glass-card--ripple': ripple,
      'glass-card-animate': animate
    }"
    :style="computedStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 双层发光边框 -->
    <span class="glass-card__glow-border"></span>

    <!-- 霓虹发光边框跑马灯 -->
    <span v-if="neon" class="glass-card__neon-marquee"></span>

    <!-- 扫描线 -->
    <span v-if="scanline" class="glass-card__scanline"></span>

    <!-- 光线扫描 -->
    <span v-if="sweep" class="glass-card__sweep-beam"></span>

    <!-- HUD 角标 -->
    <template v-if="hudCorners">
      <span class="glass-card__hud-corner glass-card__hud-corner--tl"></span>
      <span class="glass-card__hud-corner glass-card__hud-corner--tr"></span>
      <span class="glass-card__hud-corner glass-card__hud-corner--bl"></span>
      <span class="glass-card__hud-corner glass-card__hud-corner--br"></span>
    </template>

    <!-- 标题栏 -->
    <div v-if="title || $slots.header" class="glass-card__header">
      <slot name="header">
        <h3 class="glass-card__title">
          <span v-if="icon" class="glass-card__icon">{{ icon }}</span>
          <span :class="{ 'animate-neon-text': neon }">{{ title }}</span>
        </h3>
      </slot>
      <div v-if="$slots.actions" class="glass-card__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 内容 -->
    <div class="glass-card__body">
      <slot />
    </div>

    <!-- 底部 -->
    <div v-if="$slots.footer" class="glass-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  /** 卡片标题 */
  title?: string
  /** 标题图标 */
  icon?: string
  /** 是否启用悬停效果 */
  hoverable?: boolean
  /** 是否显示外层边框 */
  bordered?: boolean
  /** 是否移除内边距 */
  noPadding?: boolean
  /** 是否启用人场动画 */
  animate?: boolean
  /** 动画延迟(ms) */
  animateDelay?: number
  /** 霓虹发光边框 */
  neon?: boolean
  /** 扫描线覆盖 */
  scanline?: boolean
  /** 光线扫描 */
  sweep?: boolean
  /** 呼吸光晕 */
  glow?: boolean
  /** HUD 角标 */
  hudCorners?: boolean
  /** 悬停波纹 */
  ripple?: boolean
  /** 3D 倾斜 */
  tilt?: boolean
}>(), {
  hoverable: false,
  bordered: false,
  noPadding: false,
  animate: false,
  animateDelay: 0,
  neon: false,
  scanline: false,
  sweep: false,
  glow: false,
  hudCorners: false,
  ripple: false,
  tilt: false
})

const cardRef = ref<HTMLElement | null>(null)
const tiltX = ref(0)
const tiltY = ref(0)

function onMouseMove(e: MouseEvent) {
  if (!props.tilt || !cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  tiltX.value = y * -8
  tiltY.value = x * 8
}

function onMouseLeave() {
  tiltX.value = 0
  tiltY.value = 0
}

const computedStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.animate) {
    style.animationDelay = `${props.animateDelay}ms`
  }
  if (props.tilt) {
    style.transform = `perspective(800px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
  }
  return style
})
</script>

<style scoped>
.glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 3D 倾斜 */
.glass-card--tilt {
  perspective: 800px;
  transform-style: preserve-3d;
}

/* 双层发光边框 — 极光渐变 */
.glass-card__glow-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(0, 212, 170, .25), transparent 35%, transparent 65%, rgba(192, 132, 252, .15));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 1;
  transition: opacity var(--transition-normal);
}

/* 霓虹边框跑马灯 */
.glass-card__neon-marquee {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    var(--color-accent-green),
    var(--color-primary),
    var(--color-highlight),
    var(--color-primary)
  );
  background-size: 400% 100%;
  animation: border-marquee 12s linear infinite;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
}

/* 扫描线（平滑移动）— 极光色 */
.glass-card__scanline {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.6), rgba(192, 132, 252, 0.4), transparent);
  animation: light-sweep 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 3;
  opacity: 0.3;
}

/* 光线扫描 — 极光渐变 */
.glass-card__sweep-beam {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.08), rgba(192, 132, 252, 0.05), transparent);
  transform: skewX(-20deg);
  animation: light-sweep 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

/* HUD 角标 */
.glass-card__hud-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  z-index: 4;
}
.glass-card__hud-corner--tl { top: -1px; left: -1px; border-top: 2px solid rgba(0, 212, 170, 0.6); border-left: 2px solid rgba(0, 212, 170, 0.6); }
.glass-card__hud-corner--tr { top: -1px; right: -1px; border-top: 2px solid rgba(192, 132, 252, 0.6); border-right: 2px solid rgba(192, 132, 252, 0.6); }
.glass-card__hud-corner--bl { bottom: -1px; left: -1px; border-bottom: 2px solid rgba(192, 132, 252, 0.6); border-left: 2px solid rgba(192, 132, 252, 0.6); }
.glass-card__hud-corner--br { bottom: -1px; right: -1px; border-bottom: 2px solid rgba(0, 212, 170, 0.6); border-right: 2px solid rgba(0, 212, 170, 0.6); }

/* 外层边框 */
.glass-card--bordered {
  border-color: var(--border-glow-outer);
}

/* 无内边距 */
.glass-card--no-padding .glass-card__body {
  padding: 0;
}

/* 呼吸光晕 — 放缓为柔和的环境光 */
.glass-card--glow {
  animation: glow-breathe 6s ease-in-out infinite;
}

/* 标题栏 — 极光渐变 */
.glass-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px var(--sp-lg);
  background: linear-gradient(90deg, rgba(0, 212, 170, .08), rgba(192, 132, 252, .04), transparent 80%);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.glass-card__title {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  text-shadow: 0 0 12px rgba(0, 212, 170, 0.25);
}

.glass-card__icon {
  font-size: 16px;
  line-height: 1;
}

.glass-card__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

/* 内容 */
.glass-card__body {
  flex: 1;
  padding: var(--sp-md);
  position: relative;
  z-index: 2;
  min-height: 0;
}

/* 底部 */
.glass-card__footer {
  padding: var(--sp-sm) var(--sp-md);
  border-top: 1px solid rgba(255, 255, 255, .06);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

/* 悬停效果 — 极光发光 */
.glass-card--hoverable {
  cursor: pointer;
}

.glass-card--hoverable:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%);
  border-color: rgba(0, 212, 170, 0.25);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(0, 212, 170, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.glass-card--hoverable:hover .glass-card__glow-border {
  background: linear-gradient(135deg, rgba(0, 212, 170, .4), transparent 35%, transparent 65%, rgba(192, 132, 252, .25));
}

/* 悬停波纹 — 极光色 */
.glass-card--ripple {
  position: relative;
  overflow: hidden;
}
.glass-card--ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%), rgba(0, 212, 170, 0.12) 0%, rgba(192, 132, 252, 0.06) 40%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-normal);
  pointer-events: none;
  z-index: 1;
}
.glass-card--ripple:hover::after {
  opacity: 1;
}
</style>