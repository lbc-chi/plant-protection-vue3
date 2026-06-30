import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 公共 Header 逻辑：时间更新、全屏切换、设置/分享占位
 */
export function useAppHeader() {
  const weekday = ref('')
  const currentTime = ref('')
  const currentDate = ref('')
  let timeTimer: ReturnType<typeof setInterval> | null = null

  function updateDateTime() {
    const now = new Date()
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    weekday.value = weekdays[now.getDay()]
    currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const m = now.getMonth() + 1
    const d = String(now.getDate()).padStart(2, '0')
    currentDate.value = `${now.getFullYear()}.${m}.${d}`
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  function handleSettings() {
    // 预留：设置功能
  }

  function handleShare() {
    // 预留：分享功能
  }

  function startTimer() {
    updateDateTime()
    timeTimer = setInterval(updateDateTime, 1000)
  }

  function stopTimer() {
    if (timeTimer) {
      clearInterval(timeTimer)
      timeTimer = null
    }
  }

  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    weekday,
    currentTime,
    currentDate,
    updateDateTime,
    toggleFullscreen,
    handleSettings,
    handleShare
  }
}