'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/utils/date'

export function useTimeAgo(date: string | Date | null | undefined) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!date) return

    const intervalId = setInterval(() => {
      setTick((t) => t + 1)
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [date])

  if (!date) return null

  void tick // tick is not used directly

  return timeAgo(new Date(date))
}
