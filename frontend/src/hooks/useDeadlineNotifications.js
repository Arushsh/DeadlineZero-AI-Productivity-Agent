// src/hooks/useDeadlineNotifications.js
// Polls tasks every 60 seconds and fires:
//   - In-app toasts          (always)
//   - Browser push notifications (if permission granted)
//   - Voice announcements    (if voice assistant is enabled)
import { useEffect, useRef, useCallback } from 'react'
import { useToast } from '../components/ToastContainer'
import { useVoice } from '../context/VoiceContext'

// Thresholds (ms)
const ONE_HOUR  = 60 * 60 * 1000
const SIX_HOURS = 6  * 60 * 60 * 1000
const ONE_DAY   = 24 * 60 * 60 * 1000
const POLL_MS   = 60_000 // check every minute

function getToastConfig(msDiff, task) {
  const hours = Math.round(msDiff / 1000 / 60 / 60)
  const mins  = Math.round(msDiff / 1000 / 60)

  if (msDiff < 0) {
    return {
      type:     'deadline_critical',
      title:    'Task Overdue!',
      body:     `"${task.title}" was due ${Math.abs(hours) < 1 ? `${Math.abs(mins)} minutes` : `${Math.abs(hours)} hours`} ago.`,
      duration: 10_000,
      voiceBucket: 'overdue',
    }
  }
  if (msDiff <= ONE_HOUR) {
    return {
      type:     'deadline_critical',
      title:    'Deadline in under 1 hour!',
      body:     `"${task.title}" is due in ${mins} minute${mins !== 1 ? 's' : ''}.`,
      duration: 10_000,
      voiceBucket: '1h',
    }
  }
  if (msDiff <= SIX_HOURS) {
    return {
      type:     'deadline_warning',
      title:    'Deadline approaching',
      body:     `"${task.title}" is due in ${hours} hours.`,
      duration: 7_000,
      voiceBucket: '6h',
    }
  }
  if (msDiff <= ONE_DAY) {
    return {
      type:     'deadline_soon',
      title:    'Due tomorrow',
      body:     `"${task.title}" is due in ${hours} hours.`,
      duration: 6_000,
      voiceBucket: '24h',
    }
  }
  return null
}

function fireBrowserNotification(title, body, type) {
  if (Notification.permission !== 'granted') return
  const icons = {
    deadline_critical: '🚨',
    deadline_warning:  '⚠️',
    deadline_soon:     '🕐',
  }
  const tag = `dz-${title}`
  try {
    new Notification(`${icons[type] ?? '📌'} ${title}`, {
      body,
      tag,
      icon: '/favicon.svg',
      requireInteraction: type === 'deadline_critical',
    })
  } catch (_) {}
}

export function useDeadlineNotifications(tasks) {
  const addToast        = useToast()
  const { announceDeadline } = useVoice()

  // Track which (taskId + threshold) we've already notified so we don't spam
  const notifiedRef = useRef(new Set())

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  const check = useCallback(() => {
    if (!tasks?.length) return
    const now = Date.now()

    for (const task of tasks) {
      if (!task.deadline || task.status === 'completed') continue

      const msDiff   = new Date(task.deadline).getTime() - now
      const absHours = Math.abs(msDiff) / 1000 / 60 / 60

      // Determine which bucket this task falls into
      let bucket = null
      if (msDiff < 0 && absHours < 2)         bucket = 'overdue'
      else if (msDiff > 0 && msDiff <= ONE_HOUR)  bucket = '1h'
      else if (msDiff > 0 && msDiff <= SIX_HOURS) bucket = '6h'
      else if (msDiff > 0 && msDiff <= ONE_DAY)   bucket = '24h'

      if (!bucket) continue

      const key = `${task.id}:${bucket}`
      if (notifiedRef.current.has(key)) continue
      notifiedRef.current.add(key)

      const cfg = getToastConfig(msDiff, task)
      if (!cfg) continue

      // 1. In-app toast
      addToast(cfg)

      // 2. Browser push notification
      fireBrowserNotification(cfg.title, cfg.body, cfg.type)

      // 3. Voice announcement
      announceDeadline(task, cfg.voiceBucket)
    }
  }, [tasks, addToast, announceDeadline])

  // Request push permission once on mount
  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  // Run immediately and then on interval
  useEffect(() => {
    check()
    const interval = setInterval(check, POLL_MS)
    return () => clearInterval(interval)
  }, [check])
}
