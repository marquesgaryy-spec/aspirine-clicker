import { ITEMS } from '../game/items'
import type { ItemType } from '../game/items'

const HOTBAR_ITEMS: ItemType[] = [
  'grass', 'road_straight', 'tree', 'wall', 'roof', 'wall_door', 'street_lamp', 'car_red', 'road_cross'
]

interface Props {
  selected: ItemType
  onSelect: (type: ItemType) => void
  onOpenInventory: () => void
}

export default function Hotbar({ selected, onSelect, onOpenInventory }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 4,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(16px)',
      border: '2px solid rgba(255,255,255,0.2)',
      borderRadius: 14,
      padding: '6px 8px',
      zIndex: 100,
      alignItems: 'center',
    }}>
      {HOTBAR_ITEMS.map((type, i) => {
        const item = ITEMS.find(it => it.type === type)!
        const active = selected === type
        return (
          <div
            key={type}
            onClick={() => onSelect(type)}
            title={`${item.label} [${i + 1}]`}
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              border: active
                ? '2px solid #60a5fa'
                : '2px solid rgba(255,255,255,0.15)',
              background: active
                ? 'rgba(96,165,250,0.25)'
                : 'rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.12s',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <span style={{
              position: 'absolute',
              bottom: 3, right: 5,
              fontSize: 9,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'monospace',
            }}>{i + 1}</span>
          </div>
        )
      })}

      {/* Separator + inventory button */}
      <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
      <div
        onClick={onOpenInventory}
        title="Inventaire [E]"
        style={{
          width: 52, height: 52, borderRadius: 10,
          border: '2px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 22 }}>🎒</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>E</span>
      </div>
    </div>
  )
}
