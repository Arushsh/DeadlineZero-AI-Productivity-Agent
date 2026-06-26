// src/components/TaskCard.jsx
import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Clock, RotateCcw } from 'lucide-react'
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDeadline, getDeadlineUrgency } from '../utils/task'
import { useTasks } from '../context/TaskContext'

export default function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false)
  const [completing, setCompleting] = useState(false)
  const { completeTask, deleteTask, rescheduleTask } = useTasks()
  const isCompleted = task.status === 'completed'

  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const urgency = getDeadlineUrgency(task.deadline)
  const deadlineLabel = formatDeadline(task.deadline)

  const deadlineColors = {
    overdue:  'text-accent-red bg-accent-red/10 border border-accent-red/20',
    critical: 'text-accent-amber bg-accent-amber/10 border border-accent-amber/20',
    soon:     'text-accent-purple bg-accent-purple/10 border border-accent-purple/20',
    ok:       'text-text-tertiary bg-bg-elevated border border-border-subtle',
  }

  const priorityGlow = {
    critical: 'priority-critical',
    high:     'priority-high',
    medium:   'priority-medium',
    low:      'priority-low',
  }

  const handleComplete = async () => {
    if (isCompleted || completing) return
    setCompleting(true)
    await completeTask(task.id)
    setCompleting(false)
  }

  return (
    <div className={`group glass rounded-xl transition-all duration-200 ${
      isCompleted
        ? 'opacity-50 border-border-subtle'
        : `hover:border-border-strong hover:-translate-y-0.5 hover:shadow-lg ${priorityGlow[task.priority] || ''}`
    }`}>
      <div className="flex items-start gap-3 p-4">
        {/* Complete toggle */}
        <button
          onClick={handleComplete}
          disabled={isCompleted || completing}
          className="flex-shrink-0 mt-0.5 transition-all duration-200 hover:scale-110"
        >
          {completing ? (
            <div className="w-[18px] h-[18px] border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 size={18} className="text-accent-green" />
          ) : (
            <Circle size={18} className="text-text-tertiary hover:text-accent-purple transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium leading-snug transition-all ${
              isCompleted ? 'line-through text-text-tertiary' : 'text-text-primary'
            }`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md border ${pc.bg} ${pc.border} ${pc.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                {pc.label}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {deadlineLabel && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${deadlineColors[urgency] || deadlineColors.ok}`}>
                <Clock size={10} />
                {deadlineLabel}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="text-xs text-text-tertiary font-mono">~{task.estimated_minutes}m</span>
            )}
            {task.reschedule_count > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-accent-amber bg-accent-amber/8 px-2 py-0.5 rounded-md border border-accent-amber/15">
                <RotateCcw size={9} />
                ×{task.reschedule_count}
              </span>
            )}
            {task.tags?.map(tag => (
              <span key={tag} className="text-xs text-text-muted font-mono bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                #{tag}
              </span>
            ))}
          </div>

          {/* Subtasks toggle */}
          {task.subtasks?.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 mt-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {task.subtasks.length} subtasks
            </button>
          )}

          {expanded && task.subtasks?.length > 0 && (
            <div className="mt-2 pl-3 border-l-2 border-accent-purple/20 flex flex-col gap-1.5 animate-fade-in">
              {task.subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 text-xs text-text-secondary py-0.5">
                  <Circle size={9} className="flex-shrink-0 text-text-muted" />
                  <span className="flex-1">{sub.title}</span>
                  <span className="text-text-muted font-mono">{sub.estimated_minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <button
            onClick={() => rescheduleTask(task.id)}
            title="Mark as rescheduled"
            className="p-1.5 rounded-lg hover:bg-accent-amber/10 text-text-tertiary hover:text-accent-amber transition-all duration-150 hover:scale-110"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            title="Delete task"
            className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red transition-all duration-150 hover:scale-110"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
