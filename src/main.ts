import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/variables.css'
import './assets/global.css'
import { registerEChartsTheme } from './assets/echarts-theme'

// 注册 ECharts 暗色主题
registerEChartsTheme()

// 全局 ECharts 错误处理 - 防止 "Unknown series undefined" 等警告
if (typeof window !== 'undefined') {
  // 拦截 console.warn 来过滤掉 ECharts 的非致命警告
  const originalWarn = console.warn
  console.warn = function(...args: any[]) {
    const message = args[0]
    if (typeof message === 'string' && message.includes('Unknown series')) {
      // 静默处理这个特定的 ECharts 警告
      return
    }
    originalWarn.apply(console, args)
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err)
  console.error('[Error Info]', info)
}

app.mount('#app')
