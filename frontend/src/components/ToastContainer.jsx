// src/components/ToastContainer.jsx
// In-app toast notification system
import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import { X, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_ICONS = {
  deadline_critical: ShieldAlert,
  deadline_warning:  AlertTriangle,
  deadline_soon:     Clock,
  success:           CheckCircle2,
  info:              Info,
  error:             AlertTriangle,
}

const TOAST_STYLES = {
  deadline_critical: {
    bar:   'bg-accent-red',
    bg:    'bg-accent-red/8 border-accent-red/25',
    icon:  'text-accent-red bg-accent-red/15',
    title: 'text-accent-red',
    close: 'hover:text-accent-red',
  },
  deadline_warning: {
    bar:   'bg-accent-amber',
    bg:    'bg-accent-amber/8 border-accent-amber/25',
    icon:  'text-accent-amber bg-accent-amber/15',
    title: 'text-accent-amber',
    close: 'hover:text-accent-amber',
  },
  deadline_soon: {
    bar:   'bg-accent-purple',
    bg:    'bg-accent-purple/8 border-accent-purple/25',
    icon:  'text-accent-purple bg-accent-purple/15',
    title: 'text-accent-purple',
    close: 'hover:text-accent-purple',
  },
  success: {
    bar:   'bg-accent-green',
    bg:    'bg-accent-green/8 border-accent-green/25',
    icon:  'text-accent-green bg-accent-green/15',
    title: 'text-accent-green',
    close: 'hover:text-accent-green',
  },
  info: {
    bar:   'bg-accent-teal',
    bg:    'bg-accent-teal/8 border-accent-teal/25',
    icon:  'text-accent-teal bg-accent-teal/15',
    title: 'text-accent-teal',
    close: 'hover:text-accent-teal',
  },
  error: {
    bar:   'bg-accent-red',
    bg:    'bg-accent-red/8 border-accent-red/25',
    icon:  'text-accent-red bg-accent-red/15',
    title: 'text-accent-red',
    close: 'hover:text-accent-red',
  },
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [toast.id, onDismiss])

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss after duration
    timerRef.current = setTimeout(dismiss, toast.duration ?? 6000)
    return () => clearTimeout(timerRef.current)
  }, [dismiss, toast.duration])

  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  const Icon  = TOAST_ICONS[toast.type]  || Info

  return (
    <div
      className={`relative w-full max-w-sm glass-heavy rounded-xl border shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 ease-out ${
        visible && !exiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4'
      } ${style.bg}`}
    >
      {/* Coloured progress bar */}
      <div className={`absolute top-0 left-0 h-0.5 w-full ${style.bar} opacity-60`} />

      <div className="flex items-start gap-3 p-3.5 pr-4">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.icon}`}>
          <Icon size={15} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${style.title}`}>{toast.title}</p>
          {toast.body && (
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{toast.body}</p>
          )}
          {toast.action && (
            <button
              onClick={() => { toast.action.onClick(); dismiss() }}
              className={`text-xs font-medium mt-2 ${style.title} opacity-80 hover:opacity-100 transition-opacity`}
            >
              {toast.action.label} →
            </button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className={`p-0.5 rounded text-text-muted ${style.close} transition-colors flex-shrink-0 mt-0.5`}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast portal — fixed top-right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
            <Toast toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx.addToast
}
