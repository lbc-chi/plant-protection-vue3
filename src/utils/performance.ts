export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100

  startMeasure(name: string, metadata?: Record<string, unknown>): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.record({
        name,
        duration: Math.round(duration * 100) / 100,
        timestamp: new Date(),
        metadata
      })
    }
  }

  record(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    if (metric.duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageDuration(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name)
    if (filtered.length === 0) return null
    
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0)
    return Math.round((sum / filtered.length) * 100) / 100
  }

  clear(): void {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function withPerformanceTracking<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const endMeasure = performanceMonitor.startMeasure(name, metadata)
  
  try {
    return fn()
  } finally {
    endMeasure()
  }
}

export async function withAsyncPerformanceTracking<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const endMeasure = performanceMonitor.startMeasure(name, metadata)
  
  try {
    return await fn()
  } finally {
    endMeasure()
  }
}
