let activeEffect: ReactiveEffect

type Runner = {
  effect: ReactiveEffect
  (): void
}

class ReactiveEffect {
  private isActive = true
  public deps: Set<Set<ReactiveEffect>> = new Set()
  constructor(
    private fn: () => void,
    public scheduler?: () => void,
    public onStop?: () => void,
  ) {}

  run() {
    activeEffect = this
    return this.fn()
  }

  stop() {
    if (this.isActive) {
      this.deps.forEach(dep => {
        dep.delete(this)
      })
      this.isActive = false
      if (this.onStop) this.onStop()
    }
  }
}

type EffectOptions = {
  scheduler?: () => void
  onStop?: () => void
}
export function effect(fn: () => void, options?: EffectOptions) {
  const _effect = new ReactiveEffect(fn, options?.scheduler, options?.onStop)
  _effect.run()

  const runner = (_effect.run as Runner).bind(_effect)
  runner.effect = _effect
  return runner
}

//* 依赖收集
type TargetMap = Map<
  Record<string, unknown>,
  Map<string | symbol, Set<ReactiveEffect>>
>
const targetMap: TargetMap = new Map()

export function track(target: Record<string, unknown>, key: string | symbol) {
  // target -> key -> dep
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  // 从对象的角度出发，收集相关的 effect
  dep.add(activeEffect)

  // 如果只是单纯的 reactive 并没有 effect，此时 activeEffect 是 undefined
  // 因此这里需要做一下判断
  activeEffect?.deps.add(dep)
}

//* 触发依赖
export function trigger(target: Record<string, unknown>, key: string | symbol) {
  const dep = targetMap.get(target)!.get(key)!
  dep.forEach(e => {
    if (e.scheduler) {
      e.scheduler()
    } else {
      e.run()
    }
  })
}

//* 停止跟踪依赖
export function stop(runner: () => void) {
  ;(runner as Runner).effect.stop()
}
