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

function remove(child: any) {
  const parent = child.parentNode
  if (parent) parent.removeChild(child)
}

function setElementText(el: any, text: string) {
  el.textContent = text
}

const renderer = createRenderer({
  createElement,
  patchProps,
  insert,
  remove,
  setElementText,
})

export function createApp(rootComponent: VnodeType['type']) {
  return renderer.createApp(rootComponent)
}

export * from '../runtime-core'
