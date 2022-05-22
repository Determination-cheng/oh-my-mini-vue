import { reactive } from '../reactive'
import { effect, stop } from '../effect'

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

  it('stop', () => {
    let dummy = -1
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })

    // 在 stop 之前正常更新
    obj.prop = 2
    expect(dummy).toBe(2)

    // 执行 stop 之后，删除依赖
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)

    // 执行自增或自减会触发 GET，此时依旧不能自动触发更新
    // obj.prop++ => obj.prop = obj.prop + 1
    obj.prop++
    expect(dummy).toBe(2)

    // 手动运行 runner 时依旧可以触发更新
    runner()
    expect(dummy).toBe(4)
  })

  it('onStop', () => {
    let dummy = -1
    const obj = reactive({ foo: 1 })
    const onStop = jest.fn()

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop },
    )

    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
