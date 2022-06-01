export { isObject } from './isObject'
export { ShapeFlags } from './ShapeFlags'

export function isEvent(s: string) {
  return /^on[A-Z]/.test(s)
}

export function hasOwn(target: Record<keyof any, any>, key: keyof any) {
  return Object.prototype.hasOwnProperty.call(target, key)
}
