import { useEffect } from 'react'

export default function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      event.stopPropagation()
      const target = event.target as Node

      // Check if click is outside the main ref
      if (ref.current && !ref.current.contains(target)) {
        // Check if click is on any excluded elements

        // Only call handler if not clicking on excluded elements
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler])
}
