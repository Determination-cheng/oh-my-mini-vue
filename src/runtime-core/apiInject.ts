import { getComponentInstance } from './component'

export function provide<T>(key: string, value: T) {
  const currentInstance = getComponentInstance()

  if (currentInstance) {
    const { parent } = currentInstance

    // 初始化时，将当前组件实例的 provides 的原型设置为父组件的 provides
    // 判断初始化的标准: currentInstance.provides 和 parent.provides 指向同一个对象
    if (currentInstance.provides === parent?.provides) {
      currentInstance.provides = Object.create(parent?.provides ?? {})
    }

    currentInstance.provides[key] = value
  }
}

export function inject(key: string, defaultVal?: any | (() => any)) {
  const instance = getComponentInstance()
  if (!instance) return

  const { parent } = instance
  return (
    parent?.provides[key] ??
    (typeof defaultVal === 'function' ? defaultVal() : defaultVal)
  )
}
