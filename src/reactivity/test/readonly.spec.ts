import { readonly, isReadonly } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)

    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
  })

  it('warn', () => {
    console.warn = jest.fn()
    const obj = readonly({ prop: 1 })
    obj.prop = 2

    expect(obj.prop).toBe(1)
    expect(console.warn).toBeCalled()
  })

  it('isReadonly', () => {
    const obj = { prop: 1 }
    const observable = readonly(obj)

    expect(isReadonly(obj)).toBe(false)
    expect(isReadonly(observable)).toBe(true)
  })
})
