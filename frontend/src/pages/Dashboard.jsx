// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from 'react'
import { Plus, LogOut, Zap, Target, CheckCircle2, Clock, Moon, TrendingUp, Bell, BellOff, FlaskConical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TaskContext'
import { agentApi } from '../services/api'
import { sortTasks } from '../utils/task'
import TaskCard from '../components/TaskCard'
import ChatPanel from '../components/ChatPanel'
import AlertBar from '../components/AlertBar'
import AddTaskModal from '../components/AddTaskModal'
import TaskSkeleton from '../components/TaskSkeleton'
import HealthWidget from '../components/HealthWidget'
import VoiceSettingsPanel from '../components/VoiceSettingsPanel'
import { useDeadlineNotifications } from '../hooks/useDeadlineNotifications'
import { useToast } from '../components/ToastContainer'
import { useVoice } from '../context/VoiceContext'
import { SEED_TASKS, shouldShowSeed, markSeedSeen } from '../data/seedTasks'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { tasks, loading, fetchTasks, mergeAgentTasks } = useTasks()
  const addToast = useToast()
  const { announceAlert } = useVoice()

  const [alerts, setAlerts]             = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter]             = useState('all')
  const [focusMode, setFocusMode]       = useState(false)
  const [debriefLoading, setDebriefLoading] = useState(false)
  const [notifPerm, setNotifPerm]       = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'granted'
  )

  // Seed state — show demo data when backend is empty / unreachable
  const [seedActive, setSeedActive] = useState(false)

  // Effective task list: real tasks or seed demo tasks
  const displayTasks = seedActive ? SEED_TASKS : tasks

  // Deadline notifications (uses the effective list)
  useDeadlineNotifications(displayTasks)

  // ── On mount: fetch real tasks + session start ──
  useEffect(() => {
    fetchTasks()
    runSessionStart()
  }, [])

  // ── After loading finishes, decide if we should show seed ──
  useEffect(() => {
    if (!loading) {
      if (shouldShowSeed(tasks)) {
        setSeedActive(true)
      }
    }
  }, [loading, tasks])

  const runSessionStart = async () => {
    try {
      const res = await agentApi.sessionStart()
      if (res.alerts?.length) setAlerts(res.alerts)
      if (res.updated_tasks?.length) mergeAgentTasks(res.updated_tasks)
    } catch (e) {
      console.warn('Session start failed (backend may not be running):', e.message)
    }
  }

  const handleAlerts = useCallback((newAlerts) => {
    setAlerts(prev => [...prev, ...newAlerts])
    newAlerts.forEach(a => {
      addToast({
        type:     a.toLowerCase().includes('critical') ? 'deadline_critical' : 'deadline_warning',
        title:    'Agent Alert',
        body:     a,
        duration: 8000,
      })
      announceAlert(a)
    })
  }, [addToast, announceAlert])

  // Dismiss seed banner and mark as seen
  const dismissSeed = useCallback(() => {
    markSeedSeen()
    setSeedActive(false)
  }, [])

  // ── Stats (computed from effective list) ──
  const total     = displayTasks.length
  const completed = displayTasks.filter(t => t.status === 'completed').length
  const pending   = displayTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const critical  = displayTasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length

  const filtered = sortTasks(
    filter === 'all'     ? displayTasks :
    filter === 'pending' ? displayTasks.filter(t => t.status !== 'completed') :
                           displayTasks.filter(t => t.status === 'completed')
  )

  const focusTask = sortTasks(displayTasks.filter(t => t.status !== 'completed'))[0]

  // ── Focus mode ──
  if (focusMode && focusTask) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-accent-purple/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 max-w-lg w-full text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs text-accent-purple font-mono mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            Focus Mode
          </div>
          <div className="glass rounded-2xl p-8 mb-8 animate-pulse-glow">
            <div className="text-xs text-accent-purple font-mono mb-4 uppercase tracking-wider">Right Now</div>
            <h2 className="text-3xl font-semibold text-text-primary mb-4 leading-snug">{focusTask.title}</h2>
            {focusTask.deadline && (
              <p className="text-text-secondary text-sm">
                Due: {new Date(focusTask.deadline).toLocaleString('en-IN')}
              </p>
            )}
            {focusTask.estimated_minutes && (
              <p className="text-text-tertiary text-sm mt-1">~{focusTask.estimated_minutes} minutes</p>
            )}
            {focusTask.priority && (
              <div className={`inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-medium ${
                focusTask.priority === 'critical' ? 'bg-accent-red/15 text-accent-red border border-accent-red/25' :
                focusTask.priority === 'high'     ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/25' :
                                                    'bg-accent-purple/15 text-accent-purple border border-accent-purple/25'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  focusTask.priority === 'critical' ? 'bg-accent-red' :
                  focusTask.priority === 'high'     ? 'bg-accent-amber' : 'bg-accent-purple'
                }`} />
                {focusTask.priority} priority
              </div>
            )}
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="text-text-tertiary hover:text-text-secondary text-sm transition-colors"
          >
            ← Exit focus mode
          </button>
        </div>
      </div>
    )
  }

  // ── Main dashboard ──
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-accent-purple/8 top-[-200px] right-[-200px]" />
        <div className="orb w-[400px] h-[400px] bg-accent-teal/6 bottom-[-100px] left-[-100px]" />
      </div>

      {/* Topbar */}
      <header className="glass-heavy border-b border-border-subtle px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-violet flex items-center justify-center shadow-md shadow-accent-purple/20">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Deadline<span className="text-gradient-purple">Zero</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusMode(true)}
            title="Focus mode"
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent-purple transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-accent-purple/10 border border-transparent hover:border-accent-purple/20"
          >
            <Target size={13} />
            <span className="hidden sm:inline">Focus</span>
          </button>

          <button
            onClick={async () => {
              setDebriefLoading(true)
              try {
                const res = await agentApi.debrief()
                if (res.alerts?.length) setAlerts(prev => [...prev, ...res.alerts])
              } catch {} finally { setDebriefLoading(false) }
            }}
            disabled={debriefLoading}
            title="End-of-day debrief"
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent-teal transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-accent-teal/10 border border-transparent hover:border-accent-teal/20 disabled:opacity-50"
          >
            {debriefLoading
              ? <div className="w-3 h-3 border border-text-tertiary border-t-transparent rounded-full animate-spin" />
              : <Moon size={13} />
            }
            <span className="hidden sm:inline">Debrief</span>
          </button>

          <div className="w-px h-4 bg-border-default mx-1" />

          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-7 h-7 rounded-full border border-border-default"
              />
            )}
            <span className="text-xs text-text-secondary hidden sm:block">
              {user?.displayName?.split(' ')[0]}
            </span>
          </div>

          <VoiceSettingsPanel />

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AlertBar alerts={alerts} />

        {/* Notification permission banner */}
        {notifPerm === 'default' && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 glass rounded-xl border border-accent-purple/20 animate-slide-down">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/15 flex items-center justify-center flex-shrink-0">
              <Bell size={15} className="text-accent-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Enable deadline reminders</p>
              <p className="text-xs text-text-tertiary mt-0.5">Get browser notifications before your deadlines hit.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  const perm = await Notification.requestPermission()
                  setNotifPerm(perm)
                  if (perm === 'granted') {
                    addToast({ type: 'success', title: 'Notifications enabled!', body: "You'll be alerted before deadlines approach.", duration: 4000 })
                  }
                }}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Enable
              </button>
              <button
                onClick={() => setNotifPerm('denied')}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors p-1"
              >
                <BellOff size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Demo seed banner */}
        {seedActive && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 glass rounded-xl border border-accent-amber/20 animate-slide-down">
            <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center flex-shrink-0">
              <FlaskConical size={15} className="text-accent-amber" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Demo mode — sample tasks loaded</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                These are example tasks so you can explore the app. Connect the backend to manage real tasks.
              </p>
            </div>
            <button
              onClick={dismissSeed}
              className="text-xs text-accent-amber/70 hover:text-accent-amber border border-accent-amber/20 hover:border-accent-amber/40 px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats & Health row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Tasks', value: total,     icon: TrendingUp,   color: 'text-text-secondary', glow: '' },
              { label: 'Pending',     value: pending,   icon: Clock,        color: 'text-accent-amber',   glow: 'hover:shadow-amber-500/10' },
              { label: 'Completed',   value: completed, icon: CheckCircle2, color: 'text-accent-green',   glow: 'hover:shadow-green-500/10' },
              { label: 'Critical',    value: critical,  icon: Zap,          color: 'text-accent-red',     glow: 'hover:shadow-red-500/10' },
            ].map(({ label, value, icon: Icon, color, glow }, i) => (
              <div
                key={label}
                className={`glass rounded-xl px-4 py-3.5 hover:border-border-strong transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${glow} animate-fade-in-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className={color} />
                  <span className="text-xs text-text-tertiary">{label}</span>
                </div>
                <p className={`text-2xl font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <HealthWidget tasks={displayTasks} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left — Task list */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            {/* Filter + Add */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0.5 glass rounded-lg p-1">
                {['all', 'pending', 'completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 capitalize font-medium ${
                      filter === f
                        ? 'bg-accent-purple/20 text-accent-purple shadow-sm'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs py-2 px-4"
              >
                <Plus size={13} />
                Add task
              </button>
            </div>

            {/* Task list body */}
            {loading ? (
              <TaskSkeleton count={4} />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border-default rounded-xl glass">
                <Zap size={24} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-tertiary text-sm font-medium">No tasks here.</p>
                <p className="text-text-muted text-xs mt-1">Add one above or tell the agent in chat.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((task, i) => (
                  <div key={task.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Chat */}
          <div className="h-[600px] lg:h-auto lg:min-h-[520px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <ChatPanel onAlerts={handleAlerts} />
          </div>
        </div>
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
