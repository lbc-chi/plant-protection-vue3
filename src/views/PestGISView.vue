<template>
  <div class="pest-gis-view">
    <!-- ===== 顶部导航栏 ===== -->
    <PageHeader
      active-nav="pest-gis"
      current-page="pest-gis"
      :show-extra-actions="false"
    />

    <!-- ===== 主体布局：三栏 ===== -->
    <div class="pgv-main-body">

      <!-- ==================== 左侧面板 ==================== -->
      <aside class="pgv-left-panel animate-fade-in delay-100">
        <!-- 虫害密度等级图例 -->
        <section class="pgv-card">
          <h3 class="pgv-card-title">虫害密度等级</h3>
          <div class="density-legend">
            <div
              v-for="item in levelAggregation"
              :key="item.level"
              class="density-legend-item"
            >
              <span class="density-dot" :style="{ background: item.color }"></span>
              <span class="density-level-name">{{ item.label }}({{ item.level }}级)</span>
              <span class="density-count">{{ item.count }}个站点</span>
              <div class="density-bar-wrapper">
                <div
                  class="density-bar"
                  :style="{
                    width: (item.count / totalStations * 100) + '%',
                    background: item.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- 站点类型分布 -->
        <section class="pgv-card">
          <h3 class="pgv-card-title">站点类型分布</h3>
          <div class="type-distribution">
            <div
              v-for="item in stationTypeStats"
              :key="item.type"
              class="type-item"
            >
              <span class="type-dot" :style="{ background: item.color }"></span>
              <span class="type-name">{{ item.type }}类</span>
              <span class="type-count">{{ item.count }}个</span>
              <div class="type-bar-wrapper">
                <div
                  class="type-bar"
                  :style="{
                    width: (item.count / totalStations * 100) + '%',
                    background: item.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- 城市汇总排名 -->
        <section class="pgv-card pgv-card--scrollable">
          <h3 class="pgv-card-title">城市虫害密度排名</h3>
          <div class="city-ranking">
            <div
              v-for="(city, idx) in sortedCitySummaries"
              :key="city.city"
              class="city-rank-item"
            >
              <span class="rank-badge" :class="`rank-badge--${idx < 3 ? 'top' : 'normal'}`">
                {{ idx + 1 }}
              </span>
              <span class="rank-city-name">{{ city.city.replace('市', '') }}</span>
              <span class="rank-density">
                {{ city.avgDensity }}
                <small>/{{ city.maxDensity }}</small>
              </span>
              <span
                class="rank-level-tag"
                :class="`level-tag--${city.level}`"
              >{{ city.level }}</span>
            </div>
          </div>
        </section>
      </aside>

      <!-- ==================== 中央区域：GIS 地图 ==================== -->
      <main class="pgv-center-panel animate-fade-in delay-200">
        <div class="pgv-map-card">
          <div class="pgv-map-header">
            <h2 class="pgv-map-title">山东省植保监测站点 GIS 全域分布图</h2>
            <div class="pgv-map-stats">
              <span class="pgv-map-stat">
                <i>📍</i> 监测站点 {{ totalStations }} 个
              </span>
              <span class="pgv-map-stat">
                <i>📊</i> 采样点 {{ heatmapPoints.length }} 个
              </span>
              <span class="pgv-map-stat">
                <i>🐛</i> 平均密度 {{ avgDensity }}
              </span>
              <span class="pgv-map-stat">
                <i>⚠️</i> 高危区 {{ highRiskCount }} 个
              </span>
            </div>
          </div>

          <div class="pgv-map-wrapper">
            <CenterMap
              ref="gisMapRef"
              map-mode="gis"
              height="100%"
              :show-toolbar="true"
              :show-legend="true"
              :show-zoom-controls="true"
              :show-actions="false"
              :gis-station-markers="gisStationMarkers"
              :gis-heatmap-points="gisHeatmapPoints"
            />
          </div>

          <!-- 底部统计卡片 -->
          <div class="pgv-bottom-stats">
            <div class="gis-stat-card gis-stat-card--total">
              <div class="gis-stat-icon">📍</div>
              <CountUp
                :end-value="totalStations"
                :duration="1500"
                variant="primary"
                size="xl"
                :separator="false"
              />
              <div class="gis-stat-label">监测站点总数</div>
            </div>
            <div class="gis-stat-card gis-stat-card--danger">
              <div class="gis-stat-icon">🔴</div>
              <CountUp
                :end-value="highRiskCount"
                :duration="1500"
                variant="orange"
                size="xl"
                :separator="false"
              />
              <div class="gis-stat-label">高危站点数</div>
            </div>
            <div class="gis-stat-card gis-stat-card--avg">
              <div class="gis-stat-icon">📊</div>
              <CountUp
                :end-value="avgDensity"
                :duration="1500"
                variant="warm"
                size="xl"
                :separator="false"
              />
              <div class="gis-stat-label">平均虫害密度</div>
            </div>
            <div class="gis-stat-card gis-stat-card--peak">
              <div class="gis-stat-icon">🔥</div>
              <CountUp
                :end-value="maxDensity"
                :duration="1500"
                variant="danger"
                size="xl"
                :separator="false"
              />
              <div class="gis-stat-label">最高密度峰值</div>
            </div>
          </div>
        </div>
      </main>

      <!-- ==================== 右侧面板 ==================== -->
      <aside class="pgv-right-panel animate-fade-in delay-300">
        <!-- 区域聚集热力图例 -->
        <section class="pgv-card">
          <h3 class="pgv-card-title">热力图层说明</h3>
          <div class="heatmap-legend-bar">
            <div class="heatmap-gradient"></div>
            <div class="heatmap-labels">
              <span>低密度</span>
              <span>高密度</span>
            </div>
          </div>
          <div class="heatmap-desc">
            <p>热力图层颜色越深代表虫害密度越高。红色区域为高度聚集区，需重点关注。</p>
          </div>
        </section>

        <!-- 高危聚集区 -->
        <section class="pgv-card">
          <h3 class="pgv-card-title">区域性聚集热点</h3>
          <div class="hotspot-list">
            <div
              v-for="hotspot in hotspotAreas"
              :key="hotspot.area"
              class="hotspot-item"
            >
              <div class="hotspot-header">
                <span class="hotspot-icon">{{ hotspot.level >= 5 ? '🔴' : hotspot.level >= 4 ? '🟠' : '🟡' }}</span>
                <span class="hotspot-name">{{ hotspot.area }}</span>
                <span class="hotspot-badge" :class="`level-tag--${hotspot.levelLabel}`">
                  {{ hotspot.level }}级
                </span>
              </div>
              <div class="hotspot-detail">
                <span>{{ hotspot.stations }}个站点</span>
                <span>密度 {{ hotspot.density }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 操作说明 -->
        <section class="pgv-card">
          <h3 class="pgv-card-title">操作说明</h3>
          <ul class="pgv-tips">
            <li>🖱️ 滚轮可缩放地图</li>
            <li>📍 拖拽可平移视图</li>
            <li>🔥 切换模式查看不同图层</li>
            <li>💡 悬停站点查看详情</li>
            <li>🗺️ 点击 GIS 按钮查看热力叠加</li>
          </ul>
        </section>
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CenterMap from '@/components/business/CenterMap.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CountUp from '@/components/ui/CountUp.vue'
import { useGisStationData } from '@/composables/useGisStationData'

const gisMapRef = ref<InstanceType<typeof CenterMap> | null>(null)

// 加载 GIS 数据
const {
  stationPoints,
  heatmapPoints,
  citySummaries,
  stationTypeStats,
  levelAggregation,
  totalStations,
  maxDensity,
  avgDensity
} = useGisStationData()

// 转为 CenterMap 所需格式
const gisStationMarkers = computed(() =>
  stationPoints.map(p => ({
    name: p.name,
    coord: p.coord,
    value: p.density,
    level: p.level
  }))
)

const gisHeatmapPoints = computed(() =>
  heatmapPoints.map(p => ({
    name: p.name,
    coord: p.coord,
    value: p.value
  }))
)

// 高危站点数量
const highRiskCount = computed(() => stationPoints.filter(s => s.level >= 4).length)

// 按城市汇总排序
const sortedCitySummaries = computed(() =>
  [...citySummaries].sort((a, b) => b.maxDensity - a.maxDensity)
)

// 区域聚集热点（密度 >= 70 的城市或地理聚类）
const hotspotAreas = computed(() =>
  sortedCitySummaries.value
    .filter(c => c.maxDensity >= 50)
    .slice(0, 6)
    .map(c => ({
      area: c.city,
      stations: c.stations,
      density: c.avgDensity,
      level: c.maxDensity >= 70 ? 5 : c.maxDensity >= 60 ? 4 : 3,
      levelLabel: c.level
    }))
)
</script>

<style scoped>
.pest-gis-view {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

/* ===== 主体三栏布局 ===== */
.pgv-main-body {
  flex: 1;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr var(--right-panel-width);
  gap: var(--sp-md);
  padding: var(--sp-sm) var(--sp-lg) var(--sp-sm);
  overflow: hidden;
}

/* ===== 左侧面板 ===== */
.pgv-left-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  overflow-y: auto;
}

.pgv-left-panel::-webkit-scrollbar { width: 3px; }
.pgv-left-panel::-webkit-scrollbar-thumb { background: rgba(47, 111, 159,.12); border-radius: 2px; }

/* 卡片 */
.pgv-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-md);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.pgv-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(47, 111, 159,.12), transparent 40%, transparent 60%, rgba(47, 111, 159,.06));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.pgv-card--scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.pgv-card-title {
  margin: 0 0 var(--sp-sm);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.5px;
  padding-bottom: var(--sp-xs);
  border-bottom: 1px solid var(--glass-border);
}

/* 密度等级图例 */
.density-legend {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.density-legend-item {
  display: grid;
  grid-template-columns: 10px 60px 1fr;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background .2s;
}

.density-legend-item:hover {
  background: rgba(47, 111, 159,.05);
}

.density-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  box-shadow: 0 0 6px currentColor;
}

.density-level-name {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.density-count {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.density-bar-wrapper {
  grid-column: 1 / -1;
  height: 3px;
  background: rgba(47, 111, 159,.08);
  border-radius: 2px;
  overflow: hidden;
}

.density-bar {
  height: 100%;
  border-radius: 2px;
  transition: width .6s ease;
}

/* 站点类型分布 */
.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.type-item {
  display: grid;
  grid-template-columns: 8px 44px 1fr;
  align-items: center;
  gap: 8px;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.type-name {
  font-size: 11px;
  color: var(--text-secondary);
}

.type-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  text-align: right;
}

.type-bar-wrapper {
  grid-column: 1 / -1;
  height: 3px;
  background: rgba(47, 111, 159,.08);
  border-radius: 2px;
  overflow: hidden;
}

.type-bar {
  height: 100%;
  border-radius: 2px;
  transition: width .6s ease;
}

/* 城市排名 */
.city-ranking {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.city-rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: 4px;
  transition: background .2s;
}

.city-rank-item:hover {
  background: rgba(47, 111, 159,.05);
}

.rank-badge {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-badge--top {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
}

.rank-badge--normal {
  background: rgba(47, 111, 159,.15);
  color: #8899aa;
}

.rank-city-name {
  font-size: 11px;
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

.rank-density {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 700;
  font-family: var(--font-number);
}

.rank-density small {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
}

.rank-level-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.level-tag--高 {
  background: rgba(220,38,38,.15);
  color: #ef4444;
  border: 1px solid rgba(220,38,38,.3);
}

.level-tag--中高 {
  background: rgba(249,115,22,.15);
  color: #f97316;
  border: 1px solid rgba(249,115,22,.3);
}

.level-tag--中 {
  background: rgba(234,179,8,.15);
  color: #eab308;
  border: 1px solid rgba(234,179,8,.3);
}

.level-tag--低 {
  background: rgba(59,130,246,.15);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,.3);
}

/* ===== 中央区域 ===== */
.pgv-center-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pgv-map-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.pgv-map-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(245,158,11,.15), transparent 40%, transparent 60%, rgba(245,158,11,.08));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 1;
}

.pgv-map-header {
  padding: var(--sp-sm) var(--sp-md);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
  z-index: 2;
}

.pgv-map-title {
  margin: 0 0 6px;
  text-align: center;
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--color-accent-warm);
  letter-spacing: 1.5px;
  text-shadow: 0 0 16px rgba(251,191,36,.25);
}

.pgv-map-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pgv-map-stat {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.pgv-map-stat i {
  margin-right: 4px;
  font-style: normal;
}

.pgv-map-wrapper {
  flex: 1;
  min-height: 0;
  z-index: 2;
}

/* 底部统计卡片 */
.pgv-bottom-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-sm);
  padding: var(--sp-sm) var(--sp-md);
  border-top: 1px solid var(--glass-border);
  flex-shrink: 0;
  z-index: 2;
}

.gis-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--sp-sm) var(--sp-xs);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.gis-stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glow);
}

.gis-stat-icon { font-size: 18px; margin-bottom: 2px; }

.gis-stat-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

.gis-stat-card--total :deep(.countup-value) { color: var(--color-primary); }
.gis-stat-card--danger :deep(.countup-value) { color: var(--color-accent-orange); }
.gis-stat-card--avg :deep(.countup-value) { color: var(--color-accent-warm); }
.gis-stat-card--peak :deep(.countup-value) { color: #f87171; }

/* ===== 右侧面板 ===== */
.pgv-right-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  overflow-y: auto;
}

.pgv-right-panel::-webkit-scrollbar { width: 3px; }
.pgv-right-panel::-webkit-scrollbar-thumb { background: rgba(47, 111, 159,.12); border-radius: 2px; }

/* 热力图层说明 */
.heatmap-legend-bar {
  margin-bottom: var(--sp-xs);
}

.heatmap-gradient {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #313695, #74add1, #e0f3f8, #ffffbf, #fee090, #fdae61, #f46d43, #a50026);
  box-shadow: inset 0 1px 3px rgba(0,0,0,.3);
}

.heatmap-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
}

.heatmap-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.heatmap-desc p {
  margin: 0;
}

/* 热点区域 */
.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hotspot-item {
  padding: var(--sp-xs) var(--sp-sm);
  background: rgba(47, 111, 159,.04);
  border: 1px solid rgba(47, 111, 159,.08);
  border-radius: var(--radius-sm);
}

.hotspot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.hotspot-icon { font-size: 14px; }

.hotspot-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
  flex: 1;
}

.hotspot-badge {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.hotspot-detail {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--text-muted);
  padding-left: 22px;
}

/* 操作说明 */
.pgv-tips {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pgv-tips li {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== 响应式 ===== */
@media (max-width: 1400px) {
  .pgv-map-stats { gap: 12px; }
  .pgv-map-stat { font-size: 10px; }
}
</style>