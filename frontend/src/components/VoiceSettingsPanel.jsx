// src/components/VoiceSettingsPanel.jsx
// A slide-down panel accessible from the header that lets the user:
//  - Toggle voice assistant on/off
//  - Pick a voice from the available system voices
//  - Adjust speech rate and pitch
//  - Test the current voice

import { useState } from 'react'
import {
  Volume2, VolumeX, ChevronDown, ChevronUp,
  Play, Settings2, Mic2
} from 'lucide-react'
import { useVoice } from '../context/VoiceContext'

const ENGLISH_VOICES_ONLY = true  // set false to show all system voices

export default function VoiceSettingsPanel() {
  const {
    supported, enabled, speaking,
    voices, settings, updateSettings,
    speak, stop,
  } = useVoice()

  const [open, setOpen] = useState(false)

  if (!supported) return null

  const displayVoices = ENGLISH_VOICES_ONLY
    ? voices.filter(v => v.lang.startsWith('en'))
    : voices

  const toggle = () => {
    const next = !enabled
    updateSettings({ enabled: next })
    if (next) {
      // Brief greeting on first enable
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance("Voice assistant activated. I'll keep you on top of your deadlines.")
        utter.rate  = settings.rate
        utter.pitch = settings.pitch
        if (settings.voiceURI) {
          const v = voices.find(v => v.voiceURI === settings.voiceURI)
          if (v) utter.voice = v
        }
        window.speechSynthesis.speak(utter)
      }, 150)
    } else {
      stop()
    }
  }

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={toggle}
        title={enabled ? 'Voice assistant ON — click to disable' : 'Enable voice assistant'}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
          enabled
            ? 'text-accent-teal bg-accent-teal/10 border-accent-teal/30 hover:bg-accent-teal/15'
            : 'text-text-tertiary border-transparent hover:text-text-secondary hover:bg-bg-elevated hover:border-border-subtle'
        }`}
      >
        {enabled
          ? speaking
            ? <span className="flex gap-0.5 items-end h-3">
                {[1,2,3].map(i => (
                  <span
                    key={i}
                    className="w-0.5 bg-accent-teal rounded-full"
                    style={{
                      height: `${[60,100,40][i-1]}%`,
                      animation: `voice-bar 0.8s ease-in-out infinite`,
                      animationDelay: `${(i-1) * 0.15}s`,
                    }}
                  />
                ))}
              </span>
            : <Volume2 size={13} />
          : <VolumeX size={13} />
        }
        <span className="hidden sm:inline">{enabled ? 'Voice on' : 'Voice'}</span>
      </button>

      {/* Gear icon to open settings */}
      {enabled && (
        <button
          onClick={() => setOpen(o => !o)}
          className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
          title="Voice settings"
        >
          {open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>
      )}

      {/* Settings panel */}
      {open && enabled && (
        <div className="absolute right-0 top-10 z-50 w-72 glass-heavy rounded-xl border border-border-default shadow-2xl shadow-black/50 animate-slide-down p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={13} className="text-accent-teal" />
            <span className="text-sm font-medium text-text-primary">Voice Settings</span>
          </div>

          {/* Voice selection */}
          <div className="mb-3">
            <label className="text-xs text-text-tertiary mb-1.5 block">Voice</label>
            <select
              value={settings.voiceURI || ''}
              onChange={e => updateSettings({ voiceURI: e.target.value || null })}
              className="input-base text-xs py-2"
            >
              <option value="">Auto (recommended)</option>
              {displayVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-tertiary">Speed</label>
              <span className="text-xs text-accent-teal font-mono">{settings.rate.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min="0.5" max="2" step="0.1"
              value={settings.rate}
              onChange={e => updateSettings({ rate: parseFloat(e.target.value) })}
              className="w-full accent-accent-teal h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted mt-0.5">
              <span>Slow</span><span>Fast</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-tertiary">Pitch</label>
              <span className="text-xs text-accent-teal font-mono">{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5" max="1.8" step="0.1"
              value={settings.pitch}
              onChange={e => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-accent-teal h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted mt-0.5">
              <span>Low</span><span>High</span>
            </div>
          </div>

          {/* Test button */}
          <button
            onClick={() => speak('Hello! I am your DeadlineZero voice assistant. I will keep you on top of your deadlines.', { interrupt: true })}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-teal/10 border border-accent-teal/25 text-accent-teal text-xs font-medium hover:bg-accent-teal/15 transition-colors"
          >
            <Play size={12} />
            Test voice
          </button>
        </div>
      )}

      {/* Keyframes for the speaking bars */}
      <style>{`
        @keyframes voice-bar {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
