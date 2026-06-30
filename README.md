# 智慧植保指挥平台 (Plant Protection Command Platform)

基于 Vue 3 + TypeScript 构建的现代化智慧农业植保管理平台，提供设备监控、数据分析、预警管理等核心功能。

## 📋 项目简介

智慧植保指挥平台是一个面向现代农业的智能化管理系统，集成了物联网设备监控、数据可视化分析、病虫害监测、气象数据采集等功能模块。通过实时数据采集和智能分析，帮助农业生产者实现精准化、科学化的植物保护决策。

### 核心特性

- 📊 **实时数据监控** - 设备状态实时展示与告警通知
- 📈 **多维度数据分析** - 走廊对比、趋势预测、统计报表
- 🔔 **智能预警系统** - 多级别告警管理与快速响应
- 🗺️ **区域化管理** - 支持多区域设备分组与独立监控
- 🎨 **现代化UI** - 基于组件化的响应式界面设计
- ⚡ **高性能架构** - Vue 3 Composition API + Pinia 状态管理

## 🛠 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | ^3.5.13 | 渐进式 JavaScript 框架 |
| [TypeScript](https://www.typescriptlang.org/) | ~5.6.3 | 类型安全的超集语言 |
| [Vite](https://vitejs.dev/) | ^6.0.3 | 下一代前端构建工具 |
| [Pinia](https://pinia.vuejs.org/) | ^2.2.6 | 状态管理库 |
| [Vue Router](https://router.vuejs.org/) | ^4.4.5 | 官方路由管理器 |
| [ECharts](https://echarts.apache.org/) | ^5.5.1 | 数据可视化图表库 |
| [Axios](https://axios-http.com/) | ^1.7.7 | HTTP 请求客户端 |
| [Vitest](https://vitest.dev/) | ^2.1.8 | 单元测试框架 |
| [Vue Test Utils](https://test-utils.vuejs.org/) | ^2.4.6 | Vue 组件测试工具 |

### 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **jsdom** - 测试环境模拟

## ✨ 功能特性

### 仪表盘总览
- 关键指标卡片（设备总数、在线率、覆盖率等）
- 走廊数据对比可视化
- 采集指标统计分析
- 最近活动动态追踪

### 设备管理
- 设备列表展示与筛选
- 设备详情查看
- 按类型/状态/区域分组
- 设备搜索功能
- 多维度数据对比

### 数据可视化
- 仪表盘图表（Gauge Chart）
- 折线图/柱状图趋势分析
- 饼图分布统计
- 雷达图多维对比
- 混合图表组合展示

### 监测功能
- 病虫害实时监测
- 气象数据分析
- 项目进度跟踪
- 区域详细视图

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- Git（版本控制）

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd plant-protection-vue3

# 安装依赖
npm install
# 或使用 pnpm
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev
# 或
pnpm dev
```

访问 http://localhost:5173 查看应用

### 生产构建

```bash
# 类型检查并构建
npm run build
# 或
pnpm build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 启动测试UI界面
npm run test:ui
```

## 📁 项目结构

```
plant-protection-vue3/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 静态资源目录
│   │   ├── styles/        # 样式文件
│   │   │   ├── variables.css      # CSS变量定义
│   │   │   ├── global.css         # 全局样式
│   │   │   ├── animations.css     # 动画关键帧
│   │   │   └── responsive.css     # 响应式样式
│   │   └── images/        # 图片资源
│   ├── components/        # 可复用组件
│   │   ├── ui/           # 基础UI组件
│   │   │   ├── BaseCard.vue       # 基础卡片
│   │   │   ├── StatCard.vue       # 统计卡片
│   │   │   ├── DataTable.vue      # 数据表格
│   │   │   ├── EmptyState.vue     # 空状态
│   │   │   └── LoadingSpinner.vue # 加载动画
│   │   ├── charts/       # 图表组件
│   │   │   ├── GaugeChart.vue     # 仪表盘
│   │   │   ├── LineChart.vue      # 折线图
│   │   │   ├── BarChart.vue       # 柱状图
│   │   │   ├── PieChart.vue       # 饼图
│   │   │   ├── RadarChart.vue     # 雷达图
│   │   │   ├── MixChart.vue       # 混合图
│   │   │   └── ChartContainer.vue # 图表容器
│   │   └── business/     # 业务组件
│   │       ├── CorridorGaugeGroup.vue
│   │       ├── DeviceComparePanel.vue
│   │       ├── ProjectStatsGrid.vue
│   │       └── RegionSelector.vue
│   ├── views/             # 页面视图
│   │   ├── DashboardView.vue      # 仪表盘主页
│   │   ├── DeviceListView.vue     # 设备列表页
│   │   ├── DeviceDetailView.vue   # 设备详情页
│   │   ├── OverviewView.vue       # 总览页面
│   │   ├── PestMonitoringView.vue # 病虫害监测
│   │   ├── WeatherAnalysisView.vue# 气象分析
│   │   ├── ProjectOverviewView.vue# 项目概览
│   │   ├── RegionDetailView.vue   # 区域详情
│   │   └── NotFoundView.vue       # 404页面
│   ├── store/             # Pinia状态管理
│   │   ├── useDashboardStore.ts   # 仪表盘Store
│   │   ├── useDeviceStore.ts      # 设备Store
│   │   ├── usePestStore.ts        # 病虫害Store
│   │   ├── useProjectStore.ts     # 项目Store
│   │   └── useWeatherStore.ts     # 天气Store
│   ├── utils/             # 工具函数
│   │   ├── format.ts              # 格式化函数
│   │   ├── validate.ts            # 验证函数
│   │   ├── chart.ts               # 图表配置
│   │   ├── request.ts             # HTTP请求封装
│   │   └── storage.ts             # 本地存储
│   ├── types/             # TypeScript类型定义
│   ├── router/            # 路由配置
│   ├── App.vue            # 根组件
│   ├── main.ts            # 入口文件
│   └── __tests__/         # 测试文件
│       ├── setup.ts                # 测试配置
│       ├── components/             # 组件测试
│       ├── stores/                 # Store测试
│       └── utils/                  # 工具函数测试
├── docs/                  # 文档目录
│   ├── API.md             # API接口文档
│   └── TEST_REPORT.md     # 测试报告
├── .env.example           # 环境变量示例
├── .gitignore            # Git忽略规则
├── index.html            # HTML模板
├── package.json          # 项目依赖配置
├── tsconfig.json         # TypeScript配置
├── tsconfig.node.json    # Node.js TypeScript配置
├── vite.config.ts        # Vite配置
├── vitest.config.ts      # Vitest测试配置
├── jsconfig.json         # JavaScript配置
├── .eslintrc.cjs         # ESLint配置
└── .prettierrc           # Prettier配置
```

## 📖 开发指南

### 代码规范

#### 组件开发规范

```vue
<template>
  <div class="component-name">
    <!-- 使用语义化HTML -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  (e: 'update', value: number): void
}>()
</script>

<style scoped>
.component-name {
  /* 使用CSS变量 */
  color: var(--text-primary);
}
</style>
```

#### Store 开发规范

```typescript
export const useExampleStore = defineStore('example', () => {
  const state = ref(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const computedValue = computed(() => {
    return state.value?.property ?? defaultValue
  })

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const data = await api.getData()
      state.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '操作失败'
    } finally {
      loading.value = false
    }
  }

  return { state, loading, error, computedValue, fetchData }
})
```

### 样式规范

- 使用 CSS 变量（定义在 `variables.css`）
- 遵循 BEM 命名规范
- 使用 scoped 样式避免污染
- 响应式设计优先移动端

### Git 提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具变更

示例：
```
feat(dashboard): 添加走廊数据对比功能
fix(device): 修复设备状态更新不及时的问题
test(statcard): 增加边界情况测试用例
```

## 🧪 测试指南

### 测试结构

```
src/__tests__/
├── setup.ts                    # 全局测试配置
├── components/                 # 组件测试
│   ├── StatCard.spec.ts        # 统计卡片测试
│   ├── BaseCard.spec.ts        # 基础卡片测试
│   └── GaugeChart.spec.ts      # 仪表盘测试
├── stores/                     # Store测试
│   ├── useDashboardStore.spec.ts
│   └── useDeviceStore.spec.ts
└── utils/                      # 工具函数测试
    ├── format.spec.ts
    └── validate.spec.ts
```

### 编写测试用例

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('应该正确渲染Props', () => {
    const wrapper = mount(MyComponent, {
      props: { title: '测试' }
    })
    expect(wrapper.text()).toContain('测试')
  })

  it('应该在点击时触发事件', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### 覆盖率目标

- 语句覆盖率：≥80%
- 分支覆盖率：≥80%
- 函数覆盖率：≥80%
- 行覆盖率：≥80%

## 🌐 部署说明

### 环境准备

1. 复制环境变量文件：
```bash
cp .env.example .env.production
```

2. 配置生产环境变量：
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=智慧植保指挥平台
```

### 构建部署

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Docker 部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下流程：

### 提交 Pull Request

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 代码审查清单

- [ ] 代码符合项目风格规范
- [ ] 所有测试通过
- [ ] 新功能包含相应测试
- [ ] 文档已更新（如需要）
- [ ] 无 TypeScript 类型错误
- [ ] ESLint/Prettier 检查通过

### Issue 报告

提交 Issue 时请包含：

- 清晰的标题和描述
- 重现步骤
- 期望行为 vs 实际行为
- 截图（如适用）
- 环境信息（浏览器、Node版本等）

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](../../issues)
- 发起 [Discussion](../../discussions)
- 邮箱：contact@example.com

---

**注意**: 本项目仅供学习和研究使用，请遵守相关法律法规。
