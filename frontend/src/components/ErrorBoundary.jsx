// src/components/ErrorBoundary.jsx
// Catches any React render error and shows a graceful fallback instead of a white screen
import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // Log to console — replace with a real error reporting service in prod
    console.error('[ErrorBoundary caught]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null, showDetails: false })
    // If a custom reset callback was provided, call it too
    this.props.onReset?.()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { error, info, showDetails } = this.state
    const isAgentError =
      error?.message?.includes('Gemini') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('agent') ||
      error?.message?.includes('Failed to fetch')

    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="orb w-[500px] h-[500px] bg-accent-red/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 w-full max-w-md text-center animate-fade-in-up">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-accent-red" />
          </div>

          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {isAgentError ? 'AI Agent Unavailable' : 'Something went wrong'}
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-2">
            {isAgentError
              ? 'The Gemini backend is unreachable or returned an error. Your tasks are safe — this is a temporary glitch.'
              : 'An unexpected error occurred in the app. Try refreshing the page.'}
          </p>
          {error?.message && (
            <p className="text-xs text-text-tertiary font-mono bg-bg-surface border border-border-subtle px-3 py-2 rounded-lg mb-6 break-words">
              {error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={this.handleReset}
              className="btn-primary gap-2 py-2.5 px-5"
            >
              <RefreshCw size={14} />
              Try again
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-all"
            >
              <Home size={14} />
              Go home
            </button>
          </div>

          {/* Collapsible stack trace for devs */}
          {info?.componentStack && (
            <div className="text-left">
              <button
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-tertiary transition-colors mx-auto mb-2"
              >
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>
              {showDetails && (
                <pre className="text-xs text-text-tertiary font-mono bg-bg-surface border border-border-subtle rounded-lg p-3 overflow-auto max-h-40 text-left whitespace-pre-wrap break-words animate-fade-in">
                  {info.componentStack.trim()}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}
