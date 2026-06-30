<template>
  <span class="count-up" :class="[`count-up--${variant}`, `count-up--${size}`, { 'count-up--flicker': flicker, 'count-up--neon': neon }]">
    <span class="count-up__prefix" v-if="prefix">{{ prefix }}</span>
    <span class="count-up__value number-font" ref="valueRef">{{ displayValue }}</span>
    <span class="count-up__suffix" v-if="suffix">{{ suffix }}</span>
    <span class="count-up__unit" v-if="unit">{{ unit }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  /** 目标数值 */
  endValue?: number
  /** 动画持续时间(ms) */
  duration?: number
  /** 小数位数 */
  decimals?: number
  /** 前缀文字 */
  prefix?: string
  /** 后缀文字 */
  suffix?: string
  /** 单位 */
  unit?: string
  /** 变体: primary | green | orange | warm | danger */
  variant?: 'primary' | 'green' | 'orange' | 'warm' | 'danger'
  /** 尺寸: sm | md | lg | xl | 2xl | 3xl */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** 是否启用分隔符 */
  separator?: boolean
  /** 是否自动播放 */
  autoplay?: boolean
  /** 数字闪烁效果 */
  flicker?: boolean
  /** 霓虹光效 */
  neon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  endValue: 0,
  duration: 1500,
  decimals: 0,
  variant: 'primary',
  size: 'lg',
  separator: true,
  autoplay: true,
  flicker: false,
  neon: false
})

const displayValue = ref('0')
const valueRef = ref<HTMLElement | null>(null)
let animationFrame: number | null = null

function formatNumber(num: number): string {
  const fixed = num.toFixed(props.decimals)
  if (!props.separator) return fixed
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function animate(startTime: number, fromValue: number) {
  const elapsed = Date.now() - startTime
  const progress = Math.min(elapsed / props.duration, 1)
  const easedProgress = easeOutQuart(progress)
  const currentValue = fromValue + (props.endValue - fromValue) * easedProgress

  displayValue.value = formatNumber(currentValue)

  if (progress < 1) {
    animationFrame = requestAnimationFrame(() => animate(startTime, fromValue))
  } else {
    displayValue.value = formatNumber(props.endValue)
  }
}

function startAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  displayValue.value = formatNumber(props.endValue)
  const startTime = Date.now()
  animationFrame = requestAnimationFrame(() => animate(startTime, 0))
}

function updateValue(newVal: number) {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  const currentNum = parseFloat(displayValue.value.replace(/,/g, '')) || 0
  const startTime = Date.now()
  animationFrame = requestAnimationFrame(() => animate(startTime, currentNum))
}

onMounted(() => {
  if (props.autoplay) {
    startAnimation()
  }
})

watch(() => props.endValue, (newVal) => {
  if (newVal !== undefined) {
    updateValue(newVal)
  }
})

defineExpose({
  startAnimation,
  updateValue
})
</script>

<style scoped>
.count-up {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1.2;
}

/* ===== 变体配色 ===== */
.count-up--primary .count-up__value {
  color: var(--color-primary);
  text-shadow: 0 0 12px rgba(47, 111, 159, 0.4);
}

.count-up--green .count-up__value {
  color: var(--color-accent-green);
  text-shadow: 0 0 12px rgba(52, 211, 153, 0.4);
}

.count-up--orange .count-up__value {
  color: var(--color-accent-orange);
  text-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
}

.count-up--warm .count-up__value {
  color: var(--color-accent-warm);
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.count-up--danger .count-up__value {
  color: var(--color-accent-red);
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

/* ===== 尺寸 ===== */
.count-up--sm .count-up__value {
  font-size: var(--fs-sm);
}

.count-up--md .count-up__value {
  font-size: var(--fs-md);
}

.count-up--lg .count-up__value {
  font-size: var(--fs-lg);
  font-weight: 700;
}

.count-up--xl .count-up__value {
  font-size: var(--fs-xl);
  font-weight: 700;
}

.count-up--2xl .count-up__value {
  font-size: var(--fs-2xl);
  font-weight: 800;
}

.count-up--3xl .count-up__value {
  font-size: var(--fs-3xl);
  font-weight: 800;
}

/* ===== 辅助文字 ===== */
.count-up__prefix,
.count-up__suffix {
  font-size: 0.7em;
  color: var(--text-secondary);
  font-weight: 600;
}

.count-up__unit {
  font-size: 0.5em;
  color: var(--text-muted);
  font-weight: 600;
  margin-left: 2px;
  align-self: flex-end;
}

/* ===== 数字字体 ===== */
.count-up__value {
  font-family: var(--font-number);
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  transition: color var(--transition-normal);
}

/* 数字持续光晕 */
.count-up--flicker .count-up__value {
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.3), 0 0 16px rgba(0, 229, 255, 0.15);
}

/* 霓虹光效 */
.count-up--neon .count-up__value {
  position: relative;
}
.count-up--neon.count-up--primary .count-up__value {
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.6), 0 0 16px rgba(0, 229, 255, 0.3), 0 0 32px rgba(0, 229, 255, 0.15);
}
.count-up--neon.count-up--green .count-up__value {
  text-shadow: 0 0 8px rgba(57, 255, 20, 0.6), 0 0 16px rgba(57, 255, 20, 0.3), 0 0 32px rgba(57, 255, 20, 0.15);
}
.count-up--neon.count-up--orange .count-up__value {
  text-shadow: 0 0 8px rgba(255, 109, 0, 0.6), 0 0 16px rgba(255, 109, 0, 0.3), 0 0 32px rgba(255, 109, 0, 0.15);
}
.count-up--neon.count-up--warm .count-up__value {
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.6), 0 0 16px rgba(251, 191, 36, 0.3), 0 0 32px rgba(251, 191, 36, 0.15);
}
.count-up--neon.count-up--danger .count-up__value {
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.6), 0 0 16px rgba(239, 68, 68, 0.3), 0 0 32px rgba(239, 68, 68, 0.15);
}
</style>