<template>
  <div class="stat-card" :class="[`stat-card--${size}`, { 'stat-card--clickable': clickable }]">
    <div class="stat-card__content">
      <div class="stat-card__header">
        <div class="stat-card__info">
          <span v-if="icon" class="stat-card__icon" :style="{ background: iconBg }">
            {{ icon }}
          </span>
          <div class="stat-card__meta">
            <p class="stat-card__label">{{ label }}</p>
            <p v-if="description" class="stat-card__description">{{ description }}</p>
          </div>
        </div>

        <div v-if="$slots.extra" class="stat-card__actions">
          <slot name="extra"></slot>
        </div>
      </div>

      <div class="stat-card__value-section">
        <div class="stat-card__value-wrapper">
          <span class="stat-card__value" :class="{ 'stat-card__value--animated': animate }">
            {{ displayValue }}
          </span>
          <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
        </div>

        <div v-if="trend !== undefined || $slots.trend" class="stat-card__trend">
          <slot name="trend">
            <span
              v-if="trend !== undefined"
              class="stat-card__trend-value"
              :class="{
                'stat-card__trend--up': trend > 0,
                'stat-card__trend--down': trend < 0,
                'stat-card__trend--stable': trend === 0
              }"
            >
              <span class="stat-card__trend-icon">
                {{ trend > 0 ? '↑' : trend < 0 ? '↓' : '→' }}
              </span>
              {{ Math.abs(trend) }}%
            </span>
          </slot>
          <span v-if="compareLabel" class="stat-card__compare-label">{{ compareLabel }}</span>
        </div>
      </div>

      <div v-if="$slots.footer" class="stat-card__footer">
        <slot name="footer"></slot>
      </div>
    </div>

    <div v-if="showProgress && targetValue !== undefined" class="stat-card__progress">
      <div class="stat-card__progress-bar">
        <div
          class="stat-card__progress-fill"
          :style="{ width: `${progressPercent}%`, background: progressColor }"
        ></div>
      </div>
      <span class="stat-card__progress-text">{{ progressPercent }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number | string
  label: string
  unit?: string
  icon?: string
  description?: string
  size?: 'small' | 'medium' | 'large'
  trend?: number
  compareLabel?: string
  targetValue?: number
  showProgress?: boolean
  iconBg?: string
  format?: 'number' | 'percent' | 'currency'
  decimals?: number
  clickable?: boolean
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showProgress: false,
  iconBg: '#409EFF',
  format: 'number',
  decimals: 1,
  clickable: false,
  animate: true
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const displayValue = computed(() => {
  const num = typeof props.value === 'string' ? parseFloat(props.value) : props.value

  switch (props.format) {
    case 'percent':
      return `${num.toFixed(props.decimals)}%`
    case 'currency':
      return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: props.decimals })}`
    default:
      return num >= 10000
        ? `${(num / 10000).toFixed(1)}万`
        : num.toLocaleString('zh-CN', { maximumFractionDigits: props.decimals })
  }
})

const progressPercent = computed(() => {
  if (props.targetValue === undefined || props.targetValue === 0) return 0
  const current = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  return Math.min(Math.round((current / props.targetValue) * 100), 100)
})

const progressColor = computed(() => {
  if (progressPercent.value >= 100) return '#67C23A'
  if (progressPercent.value >= 75) return '#409EFF'
  if (progressPercent.value >= 50) return '#E6A23C'
  return '#F56C6C'
})
</script>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border-radius: var(--border-radius-base);
  padding: 20px;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.stat-card:hover {
  box-shadow: var(--shadow-md), var(--glow-card);
  border-color: rgba(255, 140, 0, 0.3);
}

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:active {
  transform: scale(0.98);
}

.stat-card--small {
  padding: 14px;
}

.stat-card--large {
  padding: 24px;
}

.stat-card__content {
  position: relative;
  z-index: 1;
}

.stat-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-card__info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.stat-card__meta {
  flex: 1;
  min-width: 0;
}

.stat-card__label {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-card__description {
  margin: 0;
  font-size: 12px;
  color: var(--text-placeholder);
}

.stat-card__value-section {
  margin-top: 8px;
}

.stat-card__value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.stat-card--small .stat-card__value {
  font-size: 24px;
}

.stat-card--large .stat-card__value {
  font-size: 32px;
}

.stat-card__value--animated {
  animation: countUp 0.6s ease-out;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card__unit {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-card__trend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-card__trend-value {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.stat-card__trend--up {
  color: var(--color-success);
  background: rgba(0, 212, 170, 0.12);
}

.stat-card__trend--down {
  color: var(--color-danger);
  background: rgba(255, 71, 87, 0.12);
}

.stat-card__trend--stable {
  color: var(--text-secondary);
  background: rgba(136, 146, 166, 0.12);
}

.stat-card__trend-icon {
  font-size: 11px;
}

.stat-card__compare-label {
  color: var(--text-placeholder);
  font-size: 12px;
}

.stat-card__footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color-lighter);
}

.stat-card__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-color-lighter);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.stat-card__progress-bar {
  flex: 1;
  height: 100%;
  background: var(--border-color-lighter);
  border-radius: 0 2px 2px 0;
  overflow: hidden;
}

.stat-card__progress-fill {
  height: 100%;
  transition: width 0.6s ease;
  border-radius: 0 2px 2px 0;
}

.stat-card__progress-text {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
