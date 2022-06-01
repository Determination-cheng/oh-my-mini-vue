export { isObject } from './isObject'
export { ShapeFlags } from './ShapeFlags'

export function isEvent(s: string) {
  return /^on[A-Z]/.test(s)
}
