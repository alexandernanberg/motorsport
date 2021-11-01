import { useRef } from 'react'

/**
 * Create constant only once.
 * @template T
 * @param {() => T} fn
 * @return {T}
 */
export function useConstant(fn) {
  const ref = useRef()

  if (!ref.current) {
    ref.current = { v: fn() }
  }

  return ref.current.v
}
