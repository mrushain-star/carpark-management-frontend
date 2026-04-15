"use client"

import { useSyncExternalStore } from "react"

interface DateTimeDisplayProps {
  iso: string
  options?: Intl.DateTimeFormatOptions
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}

// Empty subscribe function since the "isClient" state never changes after hydration
const subscribe = () => () => {}

export default function DateTimeDisplay({ 
  iso, 
  options = DEFAULT_OPTIONS
}: DateTimeDisplayProps) {
  // useSyncExternalStore is the recommended way to detect hydration/client-side status
  // without triggering "cascading render" warnings from useEffect
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,  // Client snapshot
    () => false  // Server snapshot
  )

  if (!isClient) {
    return <span className="animate-pulse bg-muted rounded px-2">...</span>
  }

  let displayValue = iso
  try {
    displayValue = new Date(iso).toLocaleString("en-US", options)
  } catch (e) {
    console.error("Error formatting date:", e)
  }

  return <>{displayValue}</>
}
