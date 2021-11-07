import { useMemo, useRef } from 'react'

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

function setRef(ref, value) {
  if (ref == null) return
  if (typeof ref === 'function') {
    ref(value)
  } else {
    try {
      ref.current = value // eslint-disable-line no-param-reassign
    } catch (error) {
      throw new Error(`Cannot assign value "${value}" to ref "${ref}"`)
    }
  }
}

export function useForkRef(...refs) {
  return useMemo(
    () => {
      if (refs.every((ref) => ref == null)) {
        return null
      }
      return (refValue) => {
        refs.forEach((ref) => setRef(ref, refValue))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  )
}
