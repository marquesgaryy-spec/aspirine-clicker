import { useState } from 'react'

interface Props {
  onEnter: (pseudo: string) => void
}

export default function LoginScreen({ onEnter }: Props) {
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = pseudo.trim()
    if (trimmed.length < 2) { setError('Au moins 2 caractères'); return }
    if (trimmed.length > 20) { setError('Maximum 20 caractères'); return }
    onEnter(trimmed)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: '#fff',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.8 + 0.2,
          }} />
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🌍</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
          GaryWorld
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 36 }}>
          Entre ton pseudo pour retrouver ta ville
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={pseudo}
            onChange={e => { setPseudo(e.target.value); setError('') }}
            placeholder="Ton pseudo…"
            maxLength={20}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 12,
              border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: error ? 8 : 20,
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Rejoindre ma ville →
          </button>
        </form>

        <div style={{ marginTop: 28, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['🏠 Construis', '🚗 Voitures', '🌅 Jour/Nuit'].map(txt => (
            <span key={txt} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{txt}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
