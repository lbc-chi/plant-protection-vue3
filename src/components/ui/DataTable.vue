<template>
  <div class="data-table-wrapper">
    <div v-if="showHeader" class="data-table-header">
      <div v-if="$slots.toolbar" class="data-table-toolbar">
        <slot name="toolbar"></slot>
      </div>

      <div v-if="searchable" class="data-table-search">
        <input
          v-model="searchQuery"
          type="text"
          class="data-table-search-input"
          :placeholder="searchPlaceholder"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="data-table-container" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }">
      <table class="data-table" :class="{ 'data-table--bordered': bordered, 'data-table--striped': striped }">
        <thead>
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.prop"
              class="data-table__th"
              :class="{
                'data-table__th--sortable': column.sortable !== false,
                'data-table__th--sorted': sortProp === column.prop,
                [`data-table__th--${column.align || 'left'}`]: true
              }"
              :style="{ width: column.width, minWidth: column.minWidth }"
              @click="handleSort(column)"
            >
              <div class="data-table__th-content">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable !== false" class="data-table__sort-icons">
                  <span
                    class="data-table__sort-icon data-table__sort-icon--asc"
                    :class="{ active: sortProp === column.prop && sortOrder === 'asc' }"
                  >
                    ▲
                  </span>
                  <span
                    class="data-table__sort-icon data-table__sort-icon--desc"
                    :class="{ active: sortProp === column.prop && sortOrder === 'desc' }"
                  >
                    ▼
                  </span>
                </span>
              </div>
            </th>
            <th v-if="$slots.action" class="data-table__th data-table__th--action">操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading && paginatedData.length === 0">
            <td :colspan="totalColumns" class="data-table__loading">
              <LoadingSpinner size="small" />
              <span>加载中...</span>
            </td>
          </tr>

          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="totalColumns" class="data-table__empty">
              <EmptyState :description="emptyText" />
            </td>
          </tr>

          <tr
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            class="data-table__tr"
            :class="{
              'data-table__tr--selected': isSelected(row),
              'data-table__tr--clickable': rowClickable
            }"
            @click="handleRowClick(row, index)"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.prop"
              class="data-table__td"
              :class="'data-table__td--' + (column.align || 'left')"
            >
              <slot :name="`cell-${column.prop}`" :row="row" :column="column" :index="index">
                <span v-if="column.formatter">
                  {{ column.formatter(row[column.prop], row, index) }}
                </span>
                <span v-else>{{ row[column.prop] }}</span>
              </slot>
            </td>
            <td v-if="$slots.action" class="data-table__td data-table__td--action">
              <slot name="action" :row="row" :index="index"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showPagination && total > pageSize" class="data-table-pagination">
      <div class="data-table-pagination-info">
        共 {{ total }} 条记录
      </div>
      <div class="data-table-pagination-controls">
        <button
          class="data-table-pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          ‹
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page === '...'"
            class="data-table-pagination-btn data-table-pagination-btn--ellipsis"
            disabled
          >
            ...
          </button>
          <button
            v-else
            class="data-table-pagination-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page as number)"
          >
            {{ page }}
          </button>
        </template>

        <button
          class="data-table-pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import EmptyState from './EmptyState.vue'

interface Column {
  prop: string
  label: string
  width?: string
  minWidth?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, row: any, index: number) => string
  visible?: boolean
}

interface Props {
  columns: Column[]
  data: any[]
  rowKey?: string | ((row: any) => string)
  loading?: boolean
  bordered?: boolean
  striped?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  emptyText?: string
  showHeader?: boolean
  showPagination?: boolean
  pageSize?: number
  currentPage?: number
  rowSelectable?: boolean
  rowClickable?: boolean
  maxHeight?: number
  defaultSort?: { prop: string; order: 'asc' | 'desc' }
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  bordered: true,
  striped: false,
  searchable: false,
  searchPlaceholder: '搜索...',
  emptyText: '暂无数据',
  showHeader: true,
  showPagination: true,
  pageSize: 10,
  currentPage: 1,
  rowSelectable: false,
  rowClickable: false
})

const emit = defineEmits<{
  (e: 'sort', prop: string, order: 'asc' | 'desc'): void
  (e: 'page-change', page: number): void
  (e: 'row-click', row: any, index: number): void
  (e: 'selection-change', rows: any[]): void
  (e: 'search', query: string): void
}>()

const searchQuery = ref('')
const sortProp = ref(props.defaultSort?.prop || '')
const sortOrder = ref<'asc' | 'desc'>(props.defaultSort?.order || 'asc')
const currentPageInternal = ref(props.currentPage)
const selectedRows = ref<any[]>([])

const visibleColumns = computed(() =>
  props.columns.filter(col => col.visible !== false)
)

const totalColumns = computed(() => visibleColumns.value.length + (props.$slots?.action ? 1 : 0))

const filteredData = computed(() => {
  if (!searchQuery.value) return props.data

  const query = searchQuery.value.toLowerCase()
  const fields = props.searchFields || props.columns.map(col => col.prop)

  return props.data.filter(row =>
    fields.some(field => String(row[field] || '').toLowerCase().includes(query))
  )
})

const sortedData = computed(() => {
  if (!sortProp.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortProp.value]
    const bVal = b[sortProp.value]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal || '')
    const bStr = String(bVal || '')
    return sortOrder.value === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })
})

const total = computed(() => sortedData.value.length)
const totalPages = computed(() => Math.ceil(total.value / props.pageSize))

const paginatedData = computed(() => {
  const start = (currentPageInternal.value - 1) * props.pageSize
  return sortedData.value.slice(start, start + props.pageSize)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPageInternal.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }

  return pages
})

function getRowKey(row: any, index: number): string {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  if (props.rowKey) return String(row[props.rowKey])
  return String(index)
}

function handleSort(column: Column) {
  if (column.sortable === false) return

  if (sortProp.value === column.prop) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortProp.value = column.prop
    sortOrder.value = 'asc'
  }

  emit('sort', sortProp.value, sortOrder.value)
}

function handleSearch() {
  emit('search', searchQuery.value)
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPageInternal.value = page
  emit('page-change', page)
}

function handleRowClick(row: any, index: number) {
  if (!props.rowClickable) return

  if (props.rowSelectable) {
    const idx = selectedRows.value.findIndex(r => getRowKey(r, 0) === getRowKey(row, 0))
    if (idx > -1) {
      selectedRows.value.splice(idx, 1)
    } else {
      selectedRows.value.push(row)
    }
    emit('selection-change', [...selectedRows.value])
  }

  emit('row-click', row, index)
}

function isSelected(row: any): boolean {
  return selectedRows.value.some(r => getRowKey(r, 0) === getRowKey(row, 0))
}

watch(() => props.currentPage, (val) => {
  currentPageInternal.value = val
})
</script>

<style scoped>
.data-table-wrapper {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.data-table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.data-table-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.data-table-search-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  min-width: 200px;
}

.data-table-search-input:focus {
  border-color: var(--color-primary);
}

.data-table-container {
  overflow-x: auto;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table--striped tbody tr:nth-child(even) {
  background: var(--bg-tertiary);
}

.data-table__th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-regular);
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  user-select: none;
}

.data-table__th--sortable {
  cursor: pointer;
  transition: background 0.2s;
}

.data-table__th--sortable:hover {
  background: rgba(255, 140, 0, 0.06);
}

.data-table__th-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.data-table__sort-icons {
  display: inline-flex;
  flex-direction: column;
  gap: -4px;
  margin-left: 4px;
}

.data-table__sort-icon {
  font-size: 8px;
  color: var(--text-placeholder);
  line-height: 1;
  transition: color 0.2s;
}

.data-table__sort-icon.active {
  color: var(--color-primary);
}

.data-table__th--center {
  text-align: center;
}

.data-table__th--right {
  text-align: right;
}

.data-table__td {
  padding: 12px 16px;
  color: var(--text-regular);
  border-bottom: 1px solid var(--border-color-lighter);
  word-break: break-word;
}

.data-table__td--center {
  text-align: center;
}

.data-table__td--right {
  text-align: right;
}

.data-table__tr {
  transition: background 0.2s;
}

.data-table__tr:hover {
  background: rgba(255, 140, 0, 0.06);
}

.data-table__tr--selected {
  background: rgba(255, 140, 0, 0.06);
}

.data-table__tr--clickable {
  cursor: pointer;
}

.data-table__loading,
.data-table__empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.data-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.data-table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color-lighter);
  background: var(--bg-tertiary);
  font-size: 13px;
  color: var(--text-regular);
}

.data-table-pagination-controls {
  display: flex;
  gap: 4px;
}

.data-table-pagination-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-regular);
  transition: all 0.2s;
}

.data-table-pagination-btn:hover:not(:disabled):not(.active) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.data-table-pagination-btn.active {
  background: var(--color-primary);
  color: var(--text-primary);
  border-color: var(--color-primary);
}

.data-table-pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.data-table-pagination-btn--ellipsis {
  border: none;
  background: transparent;
  cursor: default;
}
</style>
