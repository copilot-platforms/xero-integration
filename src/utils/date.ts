export const datetimeToDate = (date: string) => new Date(date).toISOString().split('T')[0]

export const timeAgo = (dateInput: Date) => {
  const date = new Date(dateInput)
  const now = new Date()

  // Get difference in seconds
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Threshold for "just now" (e.g., less than 60 seconds)
  if (seconds < 60) return 'just now'

  interface Interval {
    label: string
    seconds: number
  }

  const intervals: Interval[] = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`
    }
  }

  return 'just now'
}
