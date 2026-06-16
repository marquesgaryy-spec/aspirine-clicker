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

interface Props { pseudo: string }

export default function GameCanvas({ pseudo }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const engineRef  = useRef<GameEngine | null>(null)
  const [time, setTime]             = useState('08:00')
  const [isNight, setIsNight]       = useState(false)
  const [selected, setSelected]     = useState<ItemType>('grass')
  const [showInventory, setShowInventory] = useState(false)
  const [locked, setLocked]         = useState(false)
  const [savedAt, setSavedAt]       = useState<string | null>(null)
  const [flying, setFlying]         = useState(false)

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

    engine.onLockChange = (l: boolean) => {
      setLocked(l)
      if (l) setShowInventory(false)
    }

    loadWorld(pseudo).then(data => {
      if (data) engine.grid.loadFromData(data as WorldData)
    })

    const onKey = (e: KeyboardEvent) => {
      // Inventory: E (only when not locked)
      if ((e.key === 'e' || e.key === 'E') && !document.pointerLockElement) {
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: locked ? 'none' : 'default' }}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* Crosshair — visible only when locked */}
      {locked && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 50,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="10" y1="2"  x2="10" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
            <line x1="2"  y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
          </svg>
        </div>
      )}

      {/* Click-to-play overlay when not locked */}
      {!locked && !showInventory && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, padding: '12px 24px',
            color: 'rgba(255,255,255,0.8)', fontSize: 14,
            fontFamily: 'monospace', letterSpacing: 1,
          }}>
            🖱️ Cliquer pour jouer
          </div>
        </div>
      )}

      <TimeDisplay time={time} pseudo={pseudo} isNight={isNight} />

      {/* Top-right HUD */}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      }}>
        <button onClick={saveNow} style={{
          background: 'rgba(0,0,0,0.6)', border: '1px solid #333',
          borderRadius: 6, padding: '6px 12px',
          color: '#aaa', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
        }}>
          💾 {savedAt ? savedAt : 'Sauvegarder'}
        </button>
        {flying && (
          <div style={{
            background: 'rgba(96,165,250,0.2)', border: '1px solid #60a5fa',
            borderRadius: 6, padding: '4px 10px',
            color: '#93c5fd', fontSize: 11, fontFamily: 'monospace',
          }}>
            ✈ Vol actif
          </div>
        )}
      </div>

      {/* Controls hint — only when locked */}
      {locked && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 6, padding: '4px 14px',
          color: 'rgba(255,255,255,0.3)', fontSize: 10,
          fontFamily: 'monospace', whiteSpace: 'nowrap',
          zIndex: 50, pointerEvents: 'none',
        }}>
          ZQSD — bouger · Espace — sauter · 2×Espace — vol · Shift — descendre · R — tourner · E — inventaire · Échap — curseur
        </div>
      )}

      <Hotbar selected={selected} onSelect={handleSelect} onOpenInventory={() => {
        if (document.pointerLockElement) document.exitPointerLock()
        setShowInventory(true)
      }} />

      {showInventory && (
        <Inventory selected={selected} onSelect={handleSelect} onClose={() => setShowInventory(false)} />
      )}
    </div>
  )
}
