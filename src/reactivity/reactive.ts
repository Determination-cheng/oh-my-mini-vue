import {
  reactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler,
} from './reactiveHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v__IS_REACTIVE',
  IS_READONLY = '__v__IS_READONLY',
  IS_SHALLOW_READONLY = '__v__IS_SHALLOW_READONLY',
}

//* reactive
export function reactive<T extends Record<string, any>>(target: T) {
  return new Proxy(target, reactiveHandler) as T
}

export function isReactive(target: Record<keyof any, unknown> | unknown[]) {
  // 这里转布尔值是因为如果传入了一个非 Proxy 对象，就不会走到 GET 这个 Handler
  // 得到的值自然是 undefined
  return !!target[ReactiveFlags.IS_REACTIVE as any]
}

//* readonly
export function readonly<T extends Record<string, unknown>>(target: T) {
  return new Proxy(target, readonlyHandler) as T
}

export function isReadonly(target: Record<keyof any, unknown> | unknown[]) {
  // 这里转布尔值是因为如果传入了一个非 Proxy 对象，就不会走到 GET 这个 Handler
  // 得到的值自然是 undefined
  return !!target[ReactiveFlags.IS_READONLY as any]
}

//* shallowReactive
export function shallowReadonly<T extends Record<string, unknown>>(target: T) {
  return new Proxy(target, shallowReadonlyHandler) as T
}

export function isShallowReadonly(
  target: Record<keyof any, unknown> | unknown[],
) {
  return !!target[ReactiveFlags.IS_SHALLOW_READONLY as any]
}

//* isProxy
export function isProxy(target: Record<keyof any, unknown> | unknown[]) {
  return isReactive(target) || isReadonly(target)
}
