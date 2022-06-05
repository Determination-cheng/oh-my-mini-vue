import { createRenderer } from '../runtime-core'
import { isEvent } from '../utils'
import type { VnodeType } from '../runtime-core/vnode'

function createElement(type: VnodeType['type']) {
  return document.createElement(type as string)
}

function patchProps(el: any, key: string, prevProp: any, newProp: any) {
  if (isEvent(key)) {
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, newProp)
  } else {
    if (newProp === undefined || newProp === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, newProp)
    }
  }
}

function insert(el: any, container: any) {
  container.append(el)
}

const renderer = createRenderer({
  createElement,
  patchProps,
  insert,
})

export function createApp(rootComponent: VnodeType['type']) {
  return renderer.createApp(rootComponent)
}

export * from '../runtime-core'
