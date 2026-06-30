<template>
  <div
    class="base-card"
    :class="[
      `base-card--${variant}`,
      { 'base-card--hoverable': hoverable, 'base-card--bordered': bordered }
    ]"
    :style="cardStyle"
  >
    <div class="base-card__glow"></div>

    <div v-if="$slots.header || title" class="base-card__header">
      <slot name="header">
        <div class="base-card__title-wrapper">
          <span v-if="titleIcon" class="base-card__title-icon">{{ titleIcon }}</span>
          <h3 class="base-card__title">
            <span class="base-card__title-decoration"></span>
            {{ title }}
          </h3>
          <span v-if="subtitle" class="base-card__subtitle">{{ subtitle }}</span>
        </div>
        <div v-if="$slots.extra" class="base-card__extra">
          <slot name="extra"></slot>
        </div>
      </slot>
    </div>

    <div class="base-card__body" :style="bodyStyle">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  titleIcon?: string
  variant?: 'default' | 'filled' | 'outlined' | 'shadow'
  hoverable?: boolean
  bordered?: boolean
  padding?: string | number
  shadow?: 'never' | 'hover' | 'always'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: true,
  bordered: true,
  shadow: 'hover'
})

const cardStyle = computed(() => ({
  padding: typeof props.padding === 'number' ? `${props.padding}px` : props.padding
}))

const bodyStyle = computed(() => ({}))

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<style scoped>
.base-card {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-normal);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.base-card__glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0.4;
  pointer-events: none;
}

.base-card--default {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.base-card--filled {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color-lighter);
}

.base-card--outlined {
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: transparent;
}

.base-card--shadow {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-base);
}

.base-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), var(--glow-card);
  border-color: rgba(255, 140, 0, 0.3);
}

.base-card--hoverable:hover .base-card__glow {
  opacity: 0.8;
}

.base-card--bordered {
  border: 1px solid var(--border-color);
}

.base-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color-lighter);
  min-height: 48px;
}

.base-card__title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.base-card__title-icon {
  font-size: 18px;
}

.base-card__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.base-card__title-decoration {
  display: inline-block;
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-accent));
  border-radius: 2px;
  flex-shrink: 0;
}

.base-card__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
  font-weight: normal;
  margin-left: var(--spacing-sm);
}

.base-card__extra {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.base-card__body {
  padding: var(--spacing-lg);
  flex: 1;
}

.base-card__footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color-lighter);
  background: rgba(0, 0, 0, 0.15);
}
</style>