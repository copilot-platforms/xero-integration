import { useEffect, useRef } from 'react'

type UseDropdownProps = {
  setOpenDropdownId: (id: string | null) => void
}

export const useDropdown = ({ setOpenDropdownId }: UseDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element
      if (target.closest('.mapping-btn')) {
        return
      }
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
        setOpenDropdownId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setOpenDropdownId])

  return { dropdownRef }
}
