<template>
  <div class="empty-state" :class="[`empty-state--${size}`]">
    <div class="empty-state__icon">
      <slot name="icon">
        <svg
          class="empty-state__svg"
          :width="iconSize"
          :height="iconSize"
          viewBox="0 0 200 150"
          fill="none"
        >
          <rect x="30" y="40" width="140" height="90" rx="8" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="2"/>
          <path d="M70 85 L95 105 L130 65" stroke="var(--text-placeholder)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="100" cy="25" r="15" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="2"/>
          <path d="M93 25 L100 18 L107 25" stroke="var(--text-placeholder)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>

    <h3 v-if="title || $slots.title" class="empty-state__title">
      <slot name="title">{{ title }}</slot>
    </h3>

    <p class="empty-state__description">
      <slot>{{ description }}</slot>
    </p>

    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '暂无数据',
  size: 'medium'
})

const iconSize = computed(() => {
  const sizes = { small: 120, medium: 160, large: 200 }
  return sizes[props.size]
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state--small {
  padding: 24px 16px;
}

.empty-state--large {
  padding: 60px 20px;
}

.empty-state__icon {
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-state__svg {
  animation: float 3s ease-in-out infinite;
}

.empty-state__title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state--small .empty-state__title {
  font-size: 14px;
}

.empty-state--large .empty-state__title {
  font-size: 18px;
}

.empty-state__description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 320px;
  line-height: 1.6;
}

.empty-state--small .empty-state__description {
  font-size: 13px;
  max-width: 240px;
}

.empty-state__action {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
