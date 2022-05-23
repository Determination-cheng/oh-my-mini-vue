import { track, trigger } from './effect'
import { ReactiveFlags, readonly, reactive } from './reactive'
import { isObject } from '../utils'

export const reactiveHandler = {
  get: createGetter(),
  set: createSetter(),
}

export const readonlyHandler = {
  get: createGetter(true),
  set: createSetter(true),
}

export const shallowReadonlyHandler = {
  get: createGetter(true, true),
  set: createSetter(true),
}

function createGetter(isReadonly = false, isShallowReadonly = false) {
  return function get(
    target: Record<string, unknown>,
    key: string | symbol,
  ): any {
    // 用于判断是否为 Reactive
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly

    // 正常 GET
    const res = Reflect.get(target, key)

    // 如果是 shallowReadonly，既不需要深层次递归使内部各对象响应式，也不需要收集依赖
    if (isShallowReadonly) return res

    // 如果访问的属性是对象，则递归内部对象使其成为响应式
    if (isObject(res)) return isReadonly ? readonly(res) : reactive(res)

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
