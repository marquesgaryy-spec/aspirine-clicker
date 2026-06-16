import { useState } from 'react'
import { ITEMS, CATEGORIES } from '../game/items'
import type { ItemType } from '../game/items'

interface Props {
  selected: ItemType
  onSelect: (type: ItemType) => void
  onClose: () => void
}

export default function Inventory({ selected, onSelect, onClose }: Props) {
  const [cat, setCat] = useState<string>('ground')
  const filtered = ITEMS.filter(i => i.category === cat)

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div style={{
        background: '#1c1c1c',
        border: '2px solid #333',
        borderRadius: 8,
        width: 520,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        boxShadow: '0 0 0 1px #000, 0 20px 60px rgba(0,0,0,0.9)',
      }}>

        {/* Title bar */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '2px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#ccc', fontSize: 13, letterSpacing: 1 }}>INVENTAIRE</span>
          <span style={{ color: '#555', fontSize: 11 }}>[ E ] fermer</span>
        </div>

        {/* Body: tabs left + grid right */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Category tabs (left vertical bar) */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            borderRight: '2px solid #2a2a2a',
            padding: '8px 0',
            gap: 2,
            width: 80,
            flexShrink: 0,
          }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  background: cat === c.id ? '#2a2a2a' : 'transparent',
                  border: 'none',
                  borderLeft: cat === c.id ? '3px solid #60a5fa' : '3px solid transparent',
                  padding: '10px 6px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
                <span style={{
                  fontSize: 9, color: cat === c.id ? '#93c5fd' : '#555',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
            padding: 10,
            overflowY: 'auto',
            flex: 1,
            alignContent: 'start',
          }}>
            {filtered.map(item => {
              const active = selected === item.type
              return (
                <div
                  key={item.type}
                  onClick={() => { onSelect(item.type); onClose() }}
                  title={item.label}
                  style={{
                    background: active ? '#1a2a3a' : '#252525',
                    border: active ? '2px solid #60a5fa' : '2px solid #333',
                    borderRadius: 4,
                    padding: '10px 4px 7px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                  onMouseOver={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = '#2e2e2e'
                      ;(e.currentTarget as HTMLElement).style.borderColor = '#444'
                    }
                  }}
                  onMouseOut={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = '#252525'
                      ;(e.currentTarget as HTMLElement).style.borderColor = '#333'
                    }
                  }}
                >
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</div>
                  <div style={{
                    fontSize: 9, color: active ? '#93c5fd' : '#666',
                    marginTop: 5, letterSpacing: 0.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '7px 14px',
          borderTop: '2px solid #2a2a2a',
          color: '#3a3a3a', fontSize: 10, letterSpacing: 0.5,
          display: 'flex', gap: 16,
        }}>
          <span>CLIC GAUCHE → placer</span>
          <span>CLIC DROIT → supprimer</span>
          <span>R → tourner</span>
        </div>
      </div>
    </div>
  )
}
