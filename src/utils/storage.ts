const PREFIX = 'plant_protection_'

class StorageService {
  private prefix: string

  constructor(prefix: string = PREFIX) {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  set(key: string, value: any, expireIn?: number): void {
    const data = {
      value,
      timestamp: Date.now(),
      expireIn: expireIn || 0
    }
    localStorage.setItem(this.getKey(key), JSON.stringify(data))
  }

  get<T = any>(key: string): T | null {
    const raw = localStorage.getItem(this.getKey(key))
    if (!raw) return null

    try {
      const data = JSON.parse(raw)
      if (data.expireIn > 0 && Date.now() - data.timestamp > data.expireIn * 1000) {
        this.remove(key)
        return null
      }
      return data.value as T
    } catch {
      this.remove(key)
      return null
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key))
  }

  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null
  }

  setSession(key: string, value: any): void {
    sessionStorage.setItem(this.getKey(key), JSON.stringify({ value }))
  }

  getSession<T = any>(key: string): T | null {
    const raw = sessionStorage.getItem(this.getKey(key))
    if (!raw) return null

    try {
      const data = JSON.parse(raw)
      return data.value as T
    } catch {
      this.removeSession(key)
      return null
    }
  }

  removeSession(key: string): void {
    sessionStorage.removeItem(this.getKey(key))
  }

  getToken(): string | null {
    return this.get<string>('token')
  }

  setToken(token: string, expireIn?: number): void {
    this.set('token', token, expireIn)
  }

  removeToken(): void {
    this.remove('token')
  }

  getUserInfo<T = any>(): T | null {
    return this.get<T>('user_info')
  }

  setUserInfo(userInfo: any): void {
    this.set('user_info', userInfo)
  }

  removeUserInfo(): void {
    this.remove('user_info')
  }
}

export const storage = new StorageService()

export default storage
