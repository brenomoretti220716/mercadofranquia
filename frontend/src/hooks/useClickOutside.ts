import { RefObject, useEffect } from 'react'

/**
 * Runs a callback when a mousedown happens outside any of the given refs.
 * Refs are read at click time (stable ref objects), so they are not in the dependency array.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  onClickOutside: () => void,
): void {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(target),
      )
      if (isOutside) onClickOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClickOutside, refs])
}
