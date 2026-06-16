import { useState } from 'react'
import { ITEMS, CATEGORIES } from '../game/items'
import type { ItemType } from '../game/items'

interface Props {
  onSelect: (type: ItemType) => void
  onClose: () => void
  selected: ItemType
}

export default function Inventory({ onSelect, onClose, selected }: Props) {
  const [cat, setCat] = useState<string>('ground')

  const filtered = ITEMS.filter(it => it.category === cat)

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <div style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 20,
        width: '90%',
        maxWidth: 580,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 700 }}>
            🎒 Inventaire
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 8, padding: '6px 12px',
              color: '#fff', cursor: 'pointer', fontSize: 14,
            }}
          >✕</button>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: 6, padding: '12px 16px 10px',
          overflowX: 'auto', flexShrink: 0,
        }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: 'none',
                background: cat === c.id
                  ? 'rgba(96,165,250,0.3)'
                  : 'rgba(255,255,255,0.07)',
                color: cat === c.id ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: cat === c.id ? 700 : 400,
                whiteSpace: 'nowrap',
                outline: cat === c.id ? '1px solid #60a5fa' : 'none',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: 10,
          padding: '10px 16px 20px',
          overflowY: 'auto',
        }}>
          {filtered.map(item => {
            const isActive = selected === item.type
            return (
              <div
                key={item.type}
                onClick={() => { onSelect(item.type); onClose() }}
                style={{
                  padding: '14px 8px 10px',
                  borderRadius: 12,
                  border: isActive
                    ? '2px solid #60a5fa'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: isActive
                    ? 'rgba(96,165,250,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.12s',
                  userSelect: 'none',
                }}
                onMouseOver={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseOut={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 6 }}>{item.emoji}</div>
                <div style={{
                  color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.8)',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1.3,
                }}>
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          padding: '10px 20px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
          textAlign: 'center',
        }}>
          Clic gauche pour placer · Clic droit pour supprimer · R pour tourner · E pour fermer
        </div>
      </div>
    </div>
  )
}
