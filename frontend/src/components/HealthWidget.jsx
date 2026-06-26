// src/components/HealthWidget.jsx
import { Activity, Flame, ShieldCheck, AlertOctagon } from 'lucide-react'

export default function HealthWidget({ tasks }) {
  // 1. Calculate Burnout Risk
  // Based on total estimated minutes of pending tasks.
  // Assumption: > 600 mins (10 hours) = Critical, > 300 mins (5 hours) = Warning
  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const totalMinutes = pendingTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  
  let burnoutLevel = 'safe'
  if (totalMinutes > 600) burnoutLevel = 'critical'
  else if (totalMinutes > 300) burnoutLevel = 'warning'

  // 2. Calculate Procrastination Level
  // Based on total reschedule_count across all tasks.
  const totalReschedules = tasks.reduce((sum, t) => sum + (t.reschedule_count || 0), 0)
  
  let procrasLevel = 'low'
  if (totalReschedules > 10) procrasLevel = 'high'
  else if (totalReschedules > 4) procrasLevel = 'medium'

  // Styles
  const burnoutColors = {
    safe:     'text-accent-green bg-accent-green/10 border-accent-green/20 shadow-green-500/10',
    warning:  'text-accent-amber bg-accent-amber/10 border-accent-amber/20 shadow-amber-500/10',
    critical: 'text-accent-red bg-accent-red/10 border-accent-red/20 shadow-red-500/10 hover:shadow-red-500/20 animate-pulse-glow',
  }
  
  const burnoutText = {
    safe:     'Balanced',
    warning:  'Heavy Load',
    critical: 'Burnout Risk',
  }

  const procrasColors = {
    low:    'text-accent-teal',
    medium: 'text-accent-amber',
    high:   'text-accent-red',
  }

  return (
    <div className="glass rounded-xl p-4 flex flex-col justify-between h-full hover:border-border-strong transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-text-tertiary" />
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">Workload Health</h3>
      </div>

      <div className="space-y-4">
        {/* Burnout Metric */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-tertiary mb-1">Total Pipeline</p>
            <p className="text-lg font-semibold text-text-primary">{totalHours}h <span className="text-xs text-text-muted font-normal">estimated</span></p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${burnoutColors[burnoutLevel]}`}>
            {burnoutLevel === 'safe' ? <ShieldCheck size={13} /> : burnoutLevel === 'warning' ? <Flame size={13} /> : <AlertOctagon size={13} />}
            {burnoutText[burnoutLevel]}
          </div>
        </div>

        {/* Procrastination Metric */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-tertiary">Procrastination Index</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${procrasColors[procrasLevel]}`}>
              {procrasLevel.toUpperCase()}
            </span>
            <span className="text-xs text-text-muted">({totalReschedules} reschedules)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
