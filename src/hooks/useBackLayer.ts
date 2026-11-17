import { useEffect, useRef } from 'react'

const layers = new Map<symbol, { priority: number; dismiss: () => void }>()

/** Shared by Android's back button and Escape. Only the top visible layer closes. */
export function dismissTopLayer(): boolean {
  const top = [...layers.values()].sort((a, b) => b.priority - a.priority)[0]
  if (!top) return false
  top.dismiss()
  return true
}

export function useBackLayer(active: boolean, dismiss: () => void, priority = 10) {
  const latest = useRef(dismiss)
  latest.current = dismiss
  useEffect(() => {
    if (!active) return
    const id = Symbol('back-layer')
    layers.set(id, { priority, dismiss: () => latest.current() })
    return () => { layers.delete(id) }
  }, [active, priority])
}
