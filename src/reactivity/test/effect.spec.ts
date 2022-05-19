import { reactive } from '../reactive'
import { effect } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 })

    let next = 0
    effect(() => {
      next = user.age + 1
    })
    expect(next).toBe(11)

    // update
    user.age++
    expect(next).toBe(12)
  })

  it("effect's runner", () => {
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })

    expect(foo).toBe(11)

    const r = runner()

    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    let dummy = -1
    let run = () => {}

    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      // effect 的第二个参数给定一个 scheduler 的方法
      { scheduler },
    )

    // 执行完 effect 之后，依然会执行一遍 effect 的第一个参数方法，但不会执行 scheduler
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)

    // 当响应式对象发生更新时，不会执行 effect 的第一个参数方法，只会执行 scheduler
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    // 手动执行 effect 返回值时才会调用 effect 的第一个参数方法
    run()
    expect(dummy).toBe(2)
  })
})
