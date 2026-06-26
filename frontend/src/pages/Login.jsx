// src/pages/Login.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, CheckCircle2, Brain, AlertTriangle, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await login()
    } catch (e) {
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="orb w-[500px] h-[500px] bg-accent-purple/20 top-[-100px] left-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-accent-teal/10 bottom-[-100px] right-[-100px]" />
      <div className="orb w-[300px] h-[300px] bg-accent-violet/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-purple to-accent-violet border border-accent-purple/40 flex items-center justify-center shadow-lg shadow-accent-purple/20 animate-float">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-text-primary text-xl font-semibold tracking-tight">
            Deadline<span className="text-gradient-purple">Zero</span>
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs text-accent-purple font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            AI Productivity Agent · Vibe2Ship Hackathon
          </div>
          <h1 className="text-5xl font-semibold text-text-primary leading-tight mb-4">
            Never miss a<br />
            <span className="text-gradient-purple">deadline again</span>
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            An autonomous AI agent that watches your tasks,<br />
            detects risks, and acts before things go wrong.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-2.5 mb-10">
          {[
            { icon: Brain, text: 'Autonomous conflict detection', color: 'text-accent-purple' },
            { icon: AlertTriangle, text: 'Procrastination pattern alerts', color: 'text-accent-amber' },
            { icon: CheckCircle2, text: 'AI-powered task breakdown', color: 'text-accent-teal' },
          ].map(({ icon: Icon, text, color }, i) => (
            <div
              key={text}
              className="flex items-center gap-3 glass rounded-xl px-4 py-3 hover:border-border-strong transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={15} />
              </div>
              <span className="text-text-secondary text-sm">{text}</span>
              <ArrowRight size={13} className="ml-auto text-text-muted" />
            </div>
          ))}
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {error && (
          <p className="text-center text-accent-red text-sm mt-4 animate-fade-in">{error}</p>
        )}

        <p className="text-center text-text-tertiary text-xs mt-6">
          PS1: The Last-Minute Life Saver
        </p>
      </div>
    </div>
  )
}
