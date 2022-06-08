import { VnodeType } from './vnode'

export function shouldUpdateComponent(
  prevVnode: VnodeType,
  nextVnode: VnodeType,
) {
  const { props: prevProps } = prevVnode
  const { props: nextProps } = nextVnode

  for (const key in nextProps) {
    if (nextProps.hasOwnProperty(key)) {
      if (nextProps[key] !== prevProps![key]) {
        return true
      }
    }
  }

  return false
}
