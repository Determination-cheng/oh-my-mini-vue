// @ts-nocheck
import { h, getComponentInstance } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup(props) {
    const instance = getComponentInstance()
    console.log('Foo', instance)
  },
  render() {
    return h('div', {}, `Foo: ${this.count}`)
  },
}
