<template>
  <div class="loading-spinner" :class="[`loading-spinner--${size}`, { 'loading-spinner--overlay': overlay, 'loading-spinner--skeleton': skeleton }]">
    <div v-if="skeleton" class="skeleton-grid">
      <div v-for="i in skeletonBlocks" :key="i" class="skeleton-block" :style="{ animationDelay: (i * 0.1) + 's' }">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    </div>

    <div v-else class="loading-spinner__container">
      <svg
        class="loading-spinner__svg"
        :width="spinnerSize"
        :height="spinnerSize"
        viewBox="0 0 50 50"
        role="status"
        aria-label="加载中"
      >
        <circle
          class="loading-spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="color"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>

      <p v-if="text" class="loading-spinner__text">{{ text }}</p>
      
      <div v-if="progress !== null" class="loading-progress">
        <div class="loading-progress-bar">
          <div 
            class="loading-progress-fill" 
            :style="{ width: progress + '%' }"
            :aria-label="`加载进度 ${Math.round(progress)}%`"
          ></div>
        </div>
        <span class="loading-progress-text">{{ Math.round(progress) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
  overlay?: boolean
  skeleton?: boolean
  progress?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  color: '#ff8c00',
  text: '',
  overlay: false,
  skeleton: false,
  progress: null
})

const spinnerSize = computed(() => {
  const sizes = { small: 32, medium: 48, large: 64 }
  return sizes[props.size]
})

const skeletonBlocks = computed(() => props.size === 'large' ? 6 : props.size === 'medium' ? 4 : 3)
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-spinner--overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

/* ===== 骨架屏样式 ===== */
.loading-spinner--skeleton {
  padding: 24px;
}

.skeleton-grid {
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.skeleton-block {
  background: var(--bg-card, rgba(18,24,38,0.85));
  border-radius: var(--border-radius-base, 8px);
  padding: 16px;
  border: 1px solid var(--border-color-lighter, rgba(255,255,255,0.06));
  animation: skeletonShimmer 2s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, var(--border-color-lighter), var(--bg-tertiary), var(--border-color-lighter));
  border-radius: 4px;
  margin-bottom: 10px;
  animation: shimmerMove 1.5s ease-in-out infinite;
}

.skeleton-line--title {
  height: 16px;
  width: 70%;
  margin-bottom: 14px;
}

.skeleton-line--short {
  width: 45%;
  margin-bottom: 0;
}

@keyframes shimmerMove {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ===== 加载动画 ===== */
.loading-spinner__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner__svg {
  animation: rotate 1.5s linear infinite;
}

.loading-spinner__circle {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.loading-spinner--small .loading-spinner__text {
  font-size: 12px;
}

.loading-spinner--medium .loading-spinner__text {
  font-size: 14px;
}

.loading-spinner--large .loading-spinner__text {
  font-size: 16px;
}

.loading-spinner__text {
  margin: 0;
  color: var(--text-secondary);
  font-weight: 500;
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.15);
  transition: opacity 0.3s ease;
}

/* ===== 进度条 ===== */
.loading-progress {
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.loading-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary, rgba(255,140,0,0.1));
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #ff8c00), var(--color-accent, #ffd700));
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.loading-progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progressShimmer 1.5s ease-in-out infinite;
}

@keyframes progressShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.loading-progress-text {
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

</style>