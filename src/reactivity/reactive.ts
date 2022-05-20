import { track, trigger } from './effect'

//* reactive
const reactiveHandler = {
  get: createGetter(),
  set: createSetter(),
}

export function reactive<T extends Record<string, unknown>>(target: T) {
  return new Proxy(target, reactiveHandler)
}

//* readonly
const readonlyHandler = {
  get: createGetter(true),
  set: createSetter(true),
}

export function readonly<T extends Record<string, unknown>>(target: T) {
  return new Proxy(target, readonlyHandler)
}

function createGetter(isReadonly = false) {
  return function get(target: Record<string, unknown>, key: string | symbol) {
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
