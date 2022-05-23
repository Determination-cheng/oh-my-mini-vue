import { isReadonly, shallowReadonly, isShallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })

  test('isShallowReadonly', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isShallowReadonly(props)).toBe(true)
    expect(isShallowReadonly(props.n)).toBe(false)
  })
})
