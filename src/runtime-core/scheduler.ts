import { effect } from '../reactivity'

type JobType = ReturnType<typeof effect>
const queue: Set<JobType> = new Set()

let isFlushPending = false

const p = Promise.resolve()

export function nextTick(fn: (value: void) => void | PromiseLike<void>) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job: JobType) {
  queue.add(job)

  flushQueue()
}

function flushQueue() {
  if (isFlushPending) return
  isFlushPending = true

  nextTick(flushJobs)
}

function flushJobs() {
  queue.forEach(job => job())
  queue.clear()
  isFlushPending = false
}
