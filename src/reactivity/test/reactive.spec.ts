import { reactive } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    const user = { age: 10 }
    const observable = reactive(user)

    expect(observable).not.toBe(user)
    expect(observable.age).toBe(10)

    user.age++
    expect(observable.age).toBe(11)
  })
})
