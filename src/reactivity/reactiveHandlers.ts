import { track, trigger } from './effect'
import { ReactiveFlags } from './reactive'

export const reactiveHandler = {
  get: createGetter(),
  set: createSetter(),
}

export const readonlyHandler = {
  get: createGetter(true),
  set: createSetter(true),
}

function createGetter(isReadonly = false) {
  return function get(target: Record<string, unknown>, key: string | symbol) {
    // 用于判断是否为 Reactive
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly

    // 正常 GET
    const res = Reflect.get(target, key)
    // 普通的 reactive 会收集依赖
    if (!isReadonly) track(target, key)
    return res
  }
}

function createSetter(isReadonly = false) {
  return function set(
    target: Record<string, unknown>,
    key: string | symbol,
    value: any,
  ) {
    if (isReadonly) {
      console.warn(`${key.toString()} cannot be set`)
      return true
    }

    const res = Reflect.set(target, key, value)
    // 触发依赖
    trigger(target, key)
    return res
  }
}
