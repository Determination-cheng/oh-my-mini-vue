let activeEffect: ReactiveEffect

class ReactiveEffect {
  constructor(private fn: () => void, public scheduler?: () => any) {}

  run() {
    activeEffect = this
    return this.fn()
  }
}

export function effect(fn: () => void, options?: { scheduler: () => any }) {
  const _effect = new ReactiveEffect(fn, options?.scheduler)

  _effect.run()
  return _effect.run.bind(_effect)
}

//* 依赖收集
const targetMap = new Map<
  Record<string, unknown>,
  Map<string | symbol, Set<ReactiveEffect>>
>()
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

  dep.add(activeEffect)
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
