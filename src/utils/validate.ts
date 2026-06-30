type ValidateRule = (value: any) => boolean | string

interface RuleItem {
  required?: boolean
  message?: string
  validator?: ValidateRule
  pattern?: RegExp
  min?: number
  max?: number
  type?: 'string' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'array'
  trigger?: 'blur' | 'change'
}

export interface FormRules {
  [key: string]: RuleItem[]
}

export function required(message: string = '此字段为必填项'): RuleItem {
  return {
    required: true,
    message,
    trigger: 'blur'
  }
}

export function minLength(min: number, message?: string): RuleItem {
  return {
    min,
    message: message || `长度不能小于${min}个字符`,
    trigger: 'blur'
  }
}

export function maxLength(max: number, message?: string): RuleItem {
  return {
    max,
    message: message || `长度不能超过${max}个字符`,
    trigger: 'blur'
  }
}

export function email(message: string = '请输入正确的邮箱地址'): RuleItem {
  return {
    type: 'email',
    message,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    trigger: 'blur'
  }
}

export function phone(message: string = '请输入正确的手机号码'): RuleItem {
  return {
    type: 'phone',
    message,
    pattern: /^1[3-9]\d{9}$/,
    trigger: 'blur'
  }
}

export function url(message: string = '请输入正确的URL地址'): RuleItem {
  return {
    type: 'url',
    message,
    pattern: /^https?:\/\/[^\s]+$/,
    trigger: 'blur'
  }
}

export function range(min: number, max: number, message?: string): RuleItem {
  return {
    validator: (value: number) => {
      if (value < min || value > max) {
        return message || `值必须在${min}到${max}之间`
      }
      return true
    },
    trigger: 'change'
  }
}

export function custom(validator: ValidateRule, trigger: 'blur' | 'change' = 'blur'): RuleItem {
  return {
    validator,
    trigger
  }
}

export function validateField(rules: RuleItem[], value: any): string | null {
  for (const rule of rules) {
    if (rule.required && (value === undefined || value === null || value === '')) {
      return rule.message || '此字段为必填项'
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      return rule.message || '格式不正确'
    }

    if (rule.validator) {
      const result = rule.validator(value)
      if (result !== true) {
        return typeof result === 'string' ? result : (rule.message || '验证失败')
      }
    }

    if (typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        return rule.message || `长度不能小于${rule.min}个字符`
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return rule.message || `长度不能超过${rule.max}个字符`
      }
    }

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `值不能小于${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `值不能大于${rule.max}`
      }
    }
  }

  return null
}

export function validateForm(formData: Record<string, any>, formRules: FormRules): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  let valid = true

  for (const field in formRules) {
    const error = validateField(formRules[field], formData[field])
    if (error) {
      errors[field] = error
      valid = false
    }
  }

  return { valid, errors }
}
