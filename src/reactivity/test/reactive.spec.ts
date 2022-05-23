import { reactive, isReactive } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    const user = { age: 10 }
    const observable = reactive(user)

    expect(observable).not.toBe(user)
    expect(observable.age).toBe(10)

    user.age++
    expect(observable.age).toBe(11)

    expect(isReactive(user)).toBe(false)
    expect(isReactive(observable)).toBe(true)
  })

  test('nested reactive', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)

    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
