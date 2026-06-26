// src/context/VoiceContext.jsx
// Manages voice assistant state: enabled/disabled, chosen voice, rate, pitch.
// Persists settings to localStorage so preference survives page reloads.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const VoiceContext = createContext(null)

const LS_KEY = 'dz_voice_settings'

const DEFAULTS = {
  enabled:  false,
  rate:     1.05,      // slightly faster than default for a modern assistant feel
  pitch:    1.0,
  volume:   1.0,
  voiceURI: null,      // null = let browser pick default
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function VoiceProvider({ children }) {
  const [settings, setSettings]   = useState(loadSettings)
  const [voices, setVoices]       = useState([])
  const [speaking, setSpeaking]   = useState(false)
  const [supported, setSupported] = useState(false)
  const queueRef   = useRef([])
  const activeRef  = useRef(null)

  // Detect support & load available voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    setSupported(true)

    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  // Persist settings on change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  // ── Core speak function ────────────────────────────────────────────────────
  const speak = useCallback((text, { priority = 'normal', interrupt = false } = {}) => {
    if (!supported || !settings.enabled) return
    if (!text?.trim()) return

    const synth = window.speechSynthesis

    if (interrupt) {
      synth.cancel()
      queueRef.current = []
    }

    const fire = () => {
      if (synth.speaking) {
        queueRef.current.push({ text, priority })
        return
      }

      const utter = new SpeechSynthesisUtterance(text)
      utter.rate   = settings.rate
      utter.pitch  = settings.pitch
      utter.volume = settings.volume

      // Pick the saved voice, or fall back to best English voice
      if (settings.voiceURI) {
        const v = voices.find(v => v.voiceURI === settings.voiceURI)
        if (v) utter.voice = v
      } else {
        // Auto-select: prefer Google UK English Female, then any English voice
        const preferred = voices.find(v =>
          v.name.includes('Google UK English Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen')
        ) || voices.find(v => v.lang.startsWith('en'))
        if (preferred) utter.voice = preferred
      }

      utter.onstart = () => { setSpeaking(true); activeRef.current = utter }
      utter.onend   = () => {
        setSpeaking(false)
        activeRef.current = null
        // Process next item from queue
        if (queueRef.current.length > 0) {
          const next = queueRef.current.shift()
          fire(next.text)
        }
      }
      utter.onerror = () => {
        setSpeaking(false)
        activeRef.current = null
      }

      synth.speak(utter)
      setSpeaking(true)
    }

    fire()
  }, [supported, settings, voices])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    queueRef.current = []
    setSpeaking(false)
  }, [supported])

  // Convenience wrappers for different announcement types
  const announceDeadline = useCallback((task, type) => {
    const scripts = {
      overdue:  `Attention! "${task.title}" is overdue. Please address it immediately.`,
      '1h':     `Heads up! "${task.title}" is due in less than one hour. Time to focus!`,
      '6h':     `Reminder: "${task.title}" is due in about ${Math.round((new Date(task.deadline) - Date.now()) / 3600000)} hours.`,
      '24h':    `Just so you know, "${task.title}" is due tomorrow.`,
    }
    const script = scripts[type]
    if (script) speak(script, { interrupt: false })
  }, [speak])

  const announceAlert = useCallback((alertText) => {
    // Strip markdown-style prefixes like [WARN] or [CRITICAL]
    const clean = alertText.replace(/^\[.*?\]\s*/, '').trim()
    if (clean) speak(`Alert: ${clean}`, { interrupt: false })
  }, [speak])

  const announceAgentReply = useCallback((message) => {
    if (!message?.trim()) return
    // Trim to 300 chars so it doesn't read an essay
    const snippet = message.length > 300 ? message.slice(0, 297) + '...' : message
    speak(snippet, { interrupt: false })
  }, [speak])

  return (
    <VoiceContext.Provider value={{
      supported,
      enabled:  settings.enabled,
      speaking,
      voices,
      settings,
      updateSettings,
      speak,
      stop,
      announceDeadline,
      announceAlert,
      announceAgentReply,
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be inside VoiceProvider')
  return ctx
}
