// @ts-nocheck
import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)

    // readonly
    props.count++
    console.log(props)
  },
  render() {
    return h('div', {}, `Foo: ${this.count}`)
  },
}
