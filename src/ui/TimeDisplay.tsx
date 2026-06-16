interface Props {
  time: string
  pseudo: string
  isNight: boolean
}

export default function TimeDisplay({ time, pseudo, isNight }: Props) {
  const [h] = time.split(':').map(Number)
  const isDawn = h >= 5 && h < 8
  const isDusk = h >= 18 && h < 21

  const icon = isNight ? '🌙' : isDawn || isDusk ? '🌅' : '☀️'

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 16,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(12px)',
      borderRadius: 14,
      padding: '10px 18px',
      fontFamily: '"Courier New", monospace',
      userSelect: 'none',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{
          color: '#fff',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 2,
          textShadow: '0 0 10px rgba(255,220,100,0.5)',
        }}>
          {time}
        </span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2, textAlign: 'center' }}>
        👤 {pseudo}
      </div>
    </div>
  )
}
