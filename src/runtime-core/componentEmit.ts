import { camelize, toHandlerKey } from '../utils'
import type { ComponentInstance } from './component'

export function emit(
  instance: ComponentInstance,
  event: string,
  ...args: any[]
) {
  const { props } = instance

  const handlerName = toHandlerKey(camelize(event))
  const handler = props[handlerName]
  handler && handler(...args)
}

export type EmitType = typeof emit
