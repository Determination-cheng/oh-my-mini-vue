export { isObject } from './isObject'
export { ShapeFlags } from './ShapeFlags'

export function isEvent(s: string) {
  return /^on[A-Z]/.test(s)
}

export function hasOwn(target: Record<keyof any, any>, key: keyof any) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function toHandlerKey(s: string) {
  return s ? `on${capitalize(s)}` : ''
}

export function camelize(s: string) {
  return s.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : ''
  })
}
