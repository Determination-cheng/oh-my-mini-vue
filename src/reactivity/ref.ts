import { ReactiveEffect, trackEffect, runEffect } from './effect'
import { reactive } from './reactive'
import { isObject } from '../utils'

class Ref<T> {
  private _value: T
  private _rawValue: T // 如果传入对象会被转换成 Proxy，但进行对比时我们希望使用原始值
  private deps: Set<ReactiveEffect> = new Set()
  public readonly __v_IS_REF = true
  constructor(_value: T) {
    this._value = isObject(_value) ? reactive(_value) : _value
    this._rawValue = _value
  }

  get value() {
    // 依赖收集
    trackEffect(this.deps)
    return this._value
  }

  set value(newVal: any) {
    // 如果新值和旧值相等则不进行赋值 ( 主要是不重新触发依赖 )
    if (Object.is(newVal, this._rawValue)) return

    this._value = isObject(newVal) ? reactive(newVal) : newVal
    this._rawValue = newVal
    // 触发依赖
    runEffect(this.deps)
  }
}

export function ref<T>(target: T) {
  return new Ref(target)
}

export function isRef(target: any) {
  return !!target.__v_IS_REF
}

export function unref(target: unknown) {
  return isRef(target) ? (target as Ref<unknown>).value : target
}

export function proxyRefs<T extends Record<keyof any, unknown>>(target: T) {
  return new Proxy(target, {
    get(target, key) {
      return unref(Reflect.get(target, key))
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return ((target[key] as Ref<unknown>).value = value)
      }
      return Reflect.set(target, key, value)
    },
  })
}
