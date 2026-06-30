<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-wrapper" :style="{ zIndex }" @click.self="onMaskClick">
        <div class="modal-mask"></div>
        <div
          ref="dialogRef"
          class="modal-dialog"
          :class="{ 'modal--draggable': draggable }"
          :style="dialogStyle"
          @mousedown="onDragStart"
        >
          <header
            v-if="$slots.header || title || closable"
            class="modal-header"
            ref="headerRef"
          >
            <slot name="header">
              <h3 class="modal-title">{{ title }}</h3>
              <button v-if="closable" @click="close" class="modal-close">&times;</button>
            </slot>
          </header>
          <div class="modal-body">
            <slot></slot>
          </div>
          <footer v-if="footer || $slots.footer" class="modal-footer">
            <slot name="footer">
              <button @click="cancel" class="btn btn--secondary">取消</button>
              <button @click="confirm" class="btn btn--primary">确定</button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  height?: string | number
  closable?: boolean
  maskClosable?: boolean
  escClosable?: boolean
  draggable?: boolean
  footer?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: '720px',
  height: 'auto',
  closable: true,
  maskClosable: true,
  escClosable: true,
  draggable: false,
  footer: false,
  zIndex: 1050,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const dialogRef = ref<HTMLDivElement>()
const headerRef = ref<HTMLElement>()

const dialogStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
  close()
}

function onMaskClick() {
  if (props.maskClosable) {
    close()
  }
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.escClosable) {
    close()
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      document.addEventListener('keydown', handleEsc)
    } else {
      document.removeEventListener('keydown', handleEsc)
    }
  }
)

// 拖拽逻辑
let isDragging = false
let startX = 0
let startY = 0
let offsetX = 0
let offsetY = 0

function onDragStart(e: MouseEvent) {
  if (!props.draggable || !dialogRef.value) return
  if ((e.target as HTMLElement).closest('.modal-close')) return

  isDragging = true
  const rect = dialogRef.value.getBoundingClientRect()
  startX = e.clientX
  startY = e.clientY
  offsetX = rect.left
  offsetY = rect.top

  dialogRef.value.style.position = 'fixed'
  dialogRef.value.style.left = `${offsetX}px`
  dialogRef.value.style.top = `${offsetY}px`
  dialogRef.value.style.margin = '0'

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)

  if (headerRef.value) headerRef.value.style.cursor = 'grabbing'
}

function onDragMove(e: MouseEvent) {
  if (!isDragging || !dialogRef.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  dialogRef.value.style.left = `${offsetX + dx}px`
  dialogRef.value.style.top = `${offsetY + dy}px`
}

function onDragEnd() {
  isDragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  if (headerRef.value) headerRef.value.style.cursor = ''
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-dialog {
  position: relative;
  background: var(--bg-card, #1a1d29);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  border-radius: var(--border-radius-xl, 12px);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.5));
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal--draggable .modal-header {
  cursor: grab;
}

.modal--draggable .modal-header:active {
  cursor: grabbing;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-lighter, rgba(255, 255, 255, 0.06));
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  user-select: none;
}

.modal-title {
  font-size: var(--font-size-lg, 18px);
  color: var(--text-primary, #e4e7f0);
  font-weight: 600;
  margin: 0;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary, #8b92a5);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  color: var(--color-danger, #ff4757);
  background: rgba(255, 71, 87, 0.1);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  max-height: calc(90vh - 120px);
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color-lighter, rgba(255, 255, 255, 0.06));
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 24px;
  border-radius: var(--border-radius-md, 8px);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  outline: none;
  font-weight: 500;
}

.btn--primary {
  background: linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-accent, #8b5cf6));
  color: #fff;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.35);
}

.btn--primary:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.45);
}

.btn--secondary {
  background: transparent;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
  color: var(--text-regular, #a0a7b9);
}

.btn--secondary:hover {
  border-color: var(--color-primary, #3b82f6);
  color: var(--text-primary, #e4e7f0);
  background: rgba(59, 130, 246, 0.08);
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-dialog,
.modal-fade-leave-active .modal-dialog {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-dialog,
.modal-fade-leave-to .modal-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
