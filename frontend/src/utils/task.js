// src/utils/task.js

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/30', dot: 'bg-accent-red' },
  high:     { label: 'High',     color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/30', dot: 'bg-accent-amber' },
  medium:   { label: 'Medium',   color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/30', dot: 'bg-accent-purple' },
  low:      { label: 'Low',      color: 'text-text-tertiary', bg: 'bg-bg-elevated', border: 'border-border-default', dot: 'bg-text-tertiary' },
}

export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-text-secondary' },
  in_progress: { label: 'In Progress', color: 'text-accent-teal' },
  completed:   { label: 'Done',        color: 'text-accent-green' },
  overdue:     { label: 'Overdue',     color: 'text-accent-red' },
}

export function getDeadlineUrgency(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  const hours = diff / 1000 / 60 / 60
  if (hours < 0) return 'overdue'
  if (hours < 24) return 'critical'
  if (hours < 72) return 'soon'
  return 'ok'
}

export function formatDeadline(deadline) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = d - now
  const hours = Math.floor(diff / 1000 / 60 / 60)
  const days = Math.floor(hours / 24)

  if (diff < 0) return 'Overdue'
  if (hours < 1) return 'Due in < 1 hour'
  if (hours < 24) return `Due in ${hours}h`
  if (days === 1) return 'Due tomorrow'
  if (days < 7) return `Due in ${days} days`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function sortTasks(tasks) {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })
}
