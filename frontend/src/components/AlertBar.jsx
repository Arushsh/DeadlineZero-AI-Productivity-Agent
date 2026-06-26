// src/components/AlertBar.jsx
import { AlertTriangle, X, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

export default function AlertBar({ alerts }) {
  const [dismissed, setDismissed] = useState(new Set())

  const visible = alerts.filter((_, i) => !dismissed.has(i))
  if (!visible.length) return null

  return (
    <div className="flex flex-col gap-2 mb-5">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null
        const isCritical = alert.toLowerCase().includes('critical') || alert.includes('[WARN]')

        return (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm animate-slide-down ${
              isCritical
                ? 'bg-accent-red/5 border-accent-red/20'
                : 'bg-accent-amber/5 border-accent-amber/20'
            }`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-accent-red' : 'text-accent-amber'}`}>
              {isCritical ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}
            </div>
            <span 
              className="flex-1 text-text-secondary text-xs leading-relaxed [&_a]:text-accent-purple [&_a]:underline [&_a]:font-medium hover:[&_a]:text-accent-teal"
              dangerouslySetInnerHTML={{ __html: alert }}
            />
            <button
              onClick={() => setDismissed(prev => new Set([...prev, i]))}
              className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                isCritical
                  ? 'text-accent-red/50 hover:text-accent-red'
                  : 'text-accent-amber/50 hover:text-accent-amber'
              }`}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
