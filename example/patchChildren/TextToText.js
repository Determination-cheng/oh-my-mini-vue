// @ts-nocheck
import { h, ref } from '../../lib/guide-mini-vue.esm.js'

const prevChildren = 'oldChild'
const nextChildren = 'newChild'

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange

    return { isChange }
  },
  render() {
    return this.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
