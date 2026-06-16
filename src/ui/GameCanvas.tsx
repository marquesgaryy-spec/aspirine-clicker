import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '../game/GameEngine'
import type { ItemType } from '../game/items'
import TimeDisplay from './TimeDisplay'
import Hotbar from './Hotbar'
import Inventory from './Inventory'
import { loadWorld, saveWorld } from '../hooks/useSupabase'
import type { WorldData } from '../game/WorldGrid'

const HOTBAR_KEYS: ItemType[] = [
  'grass', 'road_straight', 'tree', 'wall', 'roof', 'wall_door', 'street_lamp', 'car_red', 'road_cross'
]

interface Props {
  pseudo: string
}

export default function GameCanvas({ pseudo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [time, setTime] = useState('08:00')
  const [isNight, setIsNight] = useState(false)
  const [selected, setSelected] = useState<ItemType>('grass')
  const [showInventory, setShowInventory] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Auto-save every 60s
  const saveNow = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    await saveWorld(pseudo, engine.grid.serialize())
    setSavedAt(new Date().toLocaleTimeString())
  }, [pseudo])

  useEffect(() => {
    const canvas = canvasRef.current!
    const engine = new GameEngine(canvas)
    engineRef.current = engine

    engine.onTimeUpdate = (t: string) => {
      setTime(t)
      const h = parseInt(t.split(':')[0])
      setIsNight(h < 6 || h >= 20)
    }

    // Load world
    loadWorld(pseudo).then(data => {
      if (data) engine.grid.loadFromData(data as WorldData)
    })

    // E key: inventory
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        setShowInventory(v => !v)
      }
      // Hotbar 1-9
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < HOTBAR_KEYS.length) {
        const type = HOTBAR_KEYS[idx]
        setSelected(type)
        engine.setPlacement(type)
      }
    }
    window.addEventListener('keydown', onKey)

    // Auto-save
    const interval = setInterval(saveNow, 60_000)

    return () => {
      window.removeEventListener('keydown', onKey)
      clearInterval(interval)
      engine.stop()
    }
  }, [pseudo, saveNow])

  const handleSelect = (type: ItemType) => {
    setSelected(type)
    engineRef.current?.setPlacement(type)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      <TimeDisplay time={time} pseudo={pseudo} isNight={isNight} />

      {/* Save button */}
      <button
        onClick={saveNow}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '8px 16px',
          color: '#fff', cursor: 'pointer', fontSize: 13,
          zIndex: 100,
        }}
      >
        💾 {savedAt ? `Sauvegardé ${savedAt}` : 'Sauvegarder'}
      </button>

      {/* Controls hint */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
        borderRadius: 10, padding: '6px 16px',
        color: 'rgba(255,255,255,0.5)', fontSize: 11,
        zIndex: 100, userSelect: 'none', whiteSpace: 'nowrap',
      }}>
        ZQSD/Flèches — déplacer · Molette — zoom · Clic gauche — placer · Clic droit — supprimer · R — tourner
      </div>

      <Hotbar
        selected={selected}
        onSelect={handleSelect}
        onOpenInventory={() => setShowInventory(true)}
      />

      {showInventory && (
        <Inventory
          selected={selected}
          onSelect={handleSelect}
          onClose={() => setShowInventory(false)}
        />
      )}
    </div>
  )
}
