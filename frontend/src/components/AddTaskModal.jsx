// src/components/AddTaskModal.jsx
import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { useTasks } from '../context/TaskContext'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

const PRIORITY_STYLES = {
  low:      'border-border-default text-text-tertiary',
  medium:   'border-accent-purple/50 text-accent-purple bg-accent-purple/10',
  high:     'border-accent-amber/50 text-accent-amber bg-accent-amber/10',
  critical: 'border-accent-red/50 text-accent-red bg-accent-red/10',
}

export default function AddTaskModal({ onClose }) {
  const { addTask } = useTasks()
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    estimated_minutes: 60,
    tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    try {
      await addTask({
        title: form.title.trim(),
        description: form.description || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        priority: form.priority,
        estimated_minutes: Number(form.estimated_minutes),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md glass-heavy rounded-2xl p-6 shadow-2xl shadow-black/50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-text-primary">New Task</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Add to your task list</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default text-text-tertiary hover:text-text-secondary hover:border-border-strong transition-all flex items-center justify-center"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Task title *</label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="What needs to be done?"
              className="input-base"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Description <span className="opacity-60">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any details..."
              rows={2}
              className="input-base resize-none"
            />
          </div>

          {/* Priority — segmented control */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all duration-150 capitalize ${
                    form.priority === p
                      ? PRIORITY_STYLES[p]
                      : 'border-border-subtle text-text-muted hover:border-border-default hover:text-text-tertiary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Deadline</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Est. time (min)</label>
              <input
                type="number"
                value={form.estimated_minutes}
                onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value }))}
                min={5}
                className="input-base"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block font-medium">Tags <span className="opacity-60">(comma separated)</span></label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="study, work, personal"
              className="input-base"
            />
          </div>
        </div>

        {error && (
          <p className="text-accent-red text-xs mt-3 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-accent-red" /> {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 py-2.5 rounded-xl"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <><Plus size={15} /> Add task</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
