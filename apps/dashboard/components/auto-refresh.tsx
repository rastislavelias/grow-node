'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type AutoRefreshProps = {
  intervalMs?: number
}

export function AutoRefresh({ intervalMs = 5000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    let intervalId: number | null = null

    const stopRefreshing = () => {
      if (intervalId === null) {
        return
      }

      window.clearInterval(intervalId)
      intervalId = null
    }

    const startRefreshing = () => {
      if (document.visibilityState === 'hidden' || intervalId !== null) {
        return
      }

      intervalId = window.setInterval(() => {
        router.refresh()
      }, intervalMs)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopRefreshing()
        return
      }

      router.refresh()
      startRefreshing()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    startRefreshing()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopRefreshing()
    }
  }, [intervalMs, router])

  return null
}
