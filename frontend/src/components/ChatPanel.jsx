// src/components/ChatPanel.jsx
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Bot, Loader2, Sparkles } from 'lucide-react'
import { agentApi } from '../services/api'
import { useTasks } from '../context/TaskContext'
import { useVoice } from '../context/VoiceContext'

export default function ChatPanel({ onAlerts }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: "Hey! I'm your DeadlineZero agent. Tell me your tasks in plain English — I'll handle the rest.",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const recognitionRef = useRef(null)
  const { tasks, mergeAgentTasks } = useTasks()
  const { announceAgentReply } = useVoice()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await agentApi.chat(userMsg, tasks)
      if (res.updated_tasks?.length) mergeAgentTasks(res.updated_tasks)
      if (res.alerts?.length) onAlerts(res.alerts)

      let reply = res.message || ''
      if (res.actions_taken?.length) {
        reply += `\n\n_Actions: ${res.actions_taken.join(', ')}_`
      }
      if (res.debrief) reply = res.debrief

      setMessages(prev => [...prev, { role: 'agent', text: reply }])
      
      // Voice readout of the agent's main message
      if (res.message) {
        announceAgentReply(res.message)
      } else if (res.debrief) {
        announceAgentReply("Here is your end of day debrief.")
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `Something went wrong: ${e.message}. Is the backend running?`,
        error: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Use Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = window.navigator.language || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    
    recognition.onresult = (e) => {
      let currentTranscript = ''
      for (let i = 0; i < e.results.length; i++) {
        currentTranscript += e.results[i][0].transcript
      }
      setInput(currentTranscript)
    }
    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err)
      setListening(false)
    }
    recognition.onend   = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const suggestions = [
    'I have an exam Friday',
    'Detect my conflicts',
    'Daily debrief',
  ]

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border-subtle bg-bg-elevated/30">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-purple/30 to-accent-violet/20 border border-accent-purple/30 flex items-center justify-center">
          <Bot size={14} className="text-accent-purple" />
        </div>
        <div>
          <span className="text-sm font-medium text-text-primary">AI Agent</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs text-text-tertiary">Online</span>
          </div>
        </div>
        <span className="ml-auto text-xs text-text-muted font-mono bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle">
          Gemini 2.5 Flash
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            style={{ animationDelay: '0ms' }}
          >
            {msg.role === 'agent' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple/30 to-accent-violet/20 border border-accent-purple/30 flex items-center justify-center flex-shrink-0 mt-auto mr-2">
                <Sparkles size={10} className="text-accent-purple" />
              </div>
            )}
            <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-accent-purple/25 to-accent-violet/15 text-text-primary border border-accent-purple/20 rounded-tr-sm'
                : msg.error
                  ? 'bg-accent-red/8 text-text-primary border border-accent-red/20 rounded-tl-sm'
                  : 'bg-bg-elevated text-text-primary border border-border-default rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple/30 to-accent-violet/20 border border-accent-purple/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={10} className="text-accent-purple" />
            </div>
            <div className="bg-bg-elevated border border-border-default px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs text-text-tertiary hover:text-text-secondary bg-bg-elevated hover:bg-bg-overlay border border-border-subtle hover:border-border-default px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border-subtle bg-bg-elevated/20">
        <div className="flex items-center gap-2 bg-bg-elevated border border-border-default rounded-xl px-3 py-2 focus-within:border-accent-purple/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all duration-200">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Add tasks or ask anything..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
          />
          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded-lg transition-all ${
              listening
                ? 'text-accent-red bg-accent-red/10'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-overlay'
            }`}
            title="Voice input"
          >
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 disabled:opacity-30 transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1.5 px-1">
          Try: "I have an exam Friday and project due Thursday"
        </p>
      </div>
    </div>
  )
}
