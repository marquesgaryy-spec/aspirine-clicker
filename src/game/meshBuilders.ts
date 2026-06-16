import * as THREE from 'three'
import type { ItemType } from './items'

const CELL = 2 // world units per grid cell

function mat(color: number | string, opts: Partial<THREE.MeshLambertMaterialParameters> = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts })
}
function matStd(color: number | string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, ...opts })
}

// ── Ground tiles ───────────────────────────────────────────────────────────────
function groundTile(color: number): THREE.Group {
  const g = new THREE.Group()
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(CELL, 0.15, CELL),
    mat(color)
  )
  mesh.position.y = -0.075
  mesh.receiveShadow = true
  g.add(mesh)
  return g
}

function waterTile(): THREE.Group {
  const g = new THREE.Group()
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(CELL, 0.05, CELL),
    matStd(0x38bdf8, { transparent: true, opacity: 0.75, roughness: 0, metalness: 0.2 })
  )
  mesh.position.y = -0.05
  g.add(mesh)
  return g
}

// ── Road ──────────────────────────────────────────────────────────────────────
function roadBase(color = 0x374151): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.12, CELL), mat(color))
  m.position.y = -0.06
  m.receiveShadow = true
  return m
}

function roadMarkings(horizontal = true): THREE.Mesh {
  const w = horizontal ? 0.06 : CELL * 0.95
  const d = horizontal ? CELL * 0.95 : 0.06
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, d), mat(0xfbbf24))
  m.position.y = -0.005
  return m
}

function roadStraight(): THREE.Group {
  const g = new THREE.Group()
  g.add(roadBase())
  g.add(roadMarkings(false))
  return g
}

function roadCorner(): THREE.Group {
  const g = new THREE.Group()
  g.add(roadBase())
  // Quarter-circle feel via two segments
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, CELL * 0.5), mat(0xfbbf24))
  s1.position.set(-CELL * 0.22, -0.005, CELL * 0.25)
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.5, 0.13, 0.06), mat(0xfbbf24))
  s2.position.set(-CELL * 0.25, -0.005, CELL * 0.22)
  g.add(s1, s2)
  return g
}

function roadT(): THREE.Group {
  const g = new THREE.Group()
  g.add(roadBase())
  // vertical bar
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, CELL * 0.95), mat(0xfbbf24))
  v.position.y = -0.005
  // horizontal half bar
  const h = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.45, 0.13, 0.06), mat(0xfbbf24))
  h.position.set(-CELL * 0.25, -0.005, 0)
  g.add(v, h)
  return g
}

function roadCross(): THREE.Group {
  const g = new THREE.Group()
  g.add(roadBase())
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, CELL * 0.95), mat(0xfbbf24))
  v.position.y = -0.005
  const h = roadMarkings(true)
  g.add(v, h)
  return g
}

function sidewalk(): THREE.Group {
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.18, CELL), mat(0xd1d5db))
  base.position.y = -0.09
  base.receiveShadow = true
  g.add(base)
  return g
}

// ── Nature ────────────────────────────────────────────────────────────────────
function tree(): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8),
    mat(0x92400e)
  )
  trunk.position.y = 0.35
  trunk.castShadow = true
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 8, 6),
    mat(0x15803d)
  )
  canopy.position.y = 1.2
  canopy.castShadow = true
  g.add(trunk, canopy)
  return g
}

function pine(): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8),
    mat(0x78350f)
  )
  trunk.position.y = 0.25
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 8), mat(0x166534))
  c1.position.y = 1.1
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), mat(0x15803d))
  c2.position.y = 1.6
  const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8), mat(0x166534))
  c3.position.y = 2.05
  g.add(trunk, c1, c2, c3)
  return g
}

function bush(): THREE.Group {
  const g = new THREE.Group()
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat(0x22c55e))
  s.position.y = 0.35
  s.scale.set(1, 0.7, 1)
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(0x16a34a))
  s2.position.set(0.25, 0.28, 0)
  g.add(s, s2)
  return g
}

function rock(): THREE.Group {
  const g = new THREE.Group()
  const r = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.35),
    mat(0x9ca3af)
  )
  r.position.y = 0.3
  r.scale.set(1, 0.65, 1)
  g.add(r)
  return g
}

function flower(): THREE.Group {
  const g = new THREE.Group()
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), mat(0x4ade80))
  stem.position.y = 0.15
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), mat(0xf9a8d4))
  head.position.y = 0.35
  g.add(stem, head)
  return g
}

// ── Buildings ─────────────────────────────────────────────────────────────────
function wall(): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 1.4, 0.18), mat(0xd97706))
  m.position.y = 0.7
  m.castShadow = true
  g.add(m)
  return g
}

function wallWindow(): THREE.Group {
  const g = new THREE.Group()
  // main wall
  const lo = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.35, 0.18), mat(0xd97706))
  lo.position.y = 0.175
  const hi = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.35, 0.18), mat(0xd97706))
  hi.position.y = 1.05
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.18), mat(0xd97706))
  left.position.set(-0.75, 0.65, 0)
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.18), mat(0xd97706))
  right.position.set(0.75, 0.65, 0)
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.05), mat(0x93c5fd, { transparent: true, opacity: 0.6 }))
  win.position.set(0, 0.65, 0.08)
  g.add(lo, hi, left, right, win)
  return g
}

function wallDoor(): THREE.Group {
  const g = new THREE.Group()
  const lo = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.35, 0.18), mat(0xd97706))
  lo.position.y = 1.225
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.18), mat(0xd97706))
  left.position.set(-0.72, 0.55, 0)
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.18), mat(0xd97706))
  right.position.set(0.72, 0.55, 0)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.05, 0.05), mat(0x78350f))
  door.position.set(0, 0.525, 0.08)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), mat(0xfbbf24))
  knob.position.set(0.25, 0.5, 0.13)
  g.add(lo, left, right, door, knob)
  return g
}

function roof(): THREE.Group {
  const g = new THREE.Group()
  // Prism roof using CylinderGeometry with 4 sides rotated
  const r = new THREE.Mesh(
    new THREE.CylinderGeometry(0, CELL * 0.72, 0.85, 4, 1),
    mat(0xdc2626)
  )
  r.rotation.y = Math.PI / 4
  r.position.y = 0.425
  r.castShadow = true
  g.add(r)
  return g
}

function floorWood(): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.1, CELL), mat(0xd97706))
  m.position.y = 0.05
  m.receiveShadow = true
  g.add(m)
  return g
}

function floorTile(): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.1, CELL), mat(0xf1f5f9))
  m.position.y = 0.05
  m.receiveShadow = true
  g.add(m)
  return g
}

// ── Deco ──────────────────────────────────────────────────────────────────────
function streetLamp(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8),
    mat(0x6b7280)
  )
  pole.position.y = 0.9
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.45), mat(0x6b7280))
  arm.position.set(0, 1.82, 0.22)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), matStd(0xfef9c3, { emissive: 0xfef08a, emissiveIntensity: 1 }))
  bulb.position.set(0, 1.82, 0.44)
  g.add(pole, arm, bulb)
  return g
}

function fence(): THREE.Group {
  const g = new THREE.Group()
  const bar = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.06, 0.06), mat(0xd97706))
  bar.position.set(0, 0.55, 0)
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.06, 0.06), mat(0xd97706))
  bar2.position.set(0, 0.3, 0)
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.7, 0.07), mat(0xb45309))
  p1.position.set(-0.8, 0.35, 0)
  const p2 = p1.clone(); p2.position.x = 0
  const p3 = p1.clone(); p3.position.x = 0.8
  g.add(bar, bar2, p1, p2, p3)
  return g
}

function bench(): THREE.Group {
  const g = new THREE.Group()
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.35), mat(0x92400e))
  seat.position.y = 0.4
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.06), mat(0x78350f))
  back.position.set(0, 0.58, -0.15)
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.3), mat(0x6b7280))
  leg1.position.set(-0.35, 0.2, 0)
  const leg2 = leg1.clone(); leg2.position.x = 0.35
  g.add(seat, back, leg1, leg2)
  return g
}

function mailbox(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mat(0x6b7280))
  pole.position.y = 0.35
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.2), mat(0xdc2626))
  box.position.y = 0.8
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 0.22, 0.12, 4),
    mat(0xb91c1c)
  )
  top.rotation.y = Math.PI / 4
  top.position.y = 0.97
  g.add(pole, box, top)
  return g
}

// ── Cars ──────────────────────────────────────────────────────────────────────
function car(bodyColor: number): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 1.1), matStd(bodyColor))
  body.position.y = 0.21
  body.castShadow = true
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.6), matStd(bodyColor))
  cabin.position.set(0, 0.43, 0.05)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.15, 0.02), matStd(0x93c5fd, { transparent: true, opacity: 0.7 }))
  windshield.position.set(0, 0.43, -0.24)
  const rearWin = windshield.clone(); rearWin.position.z = 0.34
  const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10)
  const wheelMat = matStd(0x1f2937)
  const positions = [[-0.38, 0.12, -0.35], [0.38, 0.12, -0.35], [-0.38, 0.12, 0.35], [0.38, 0.12, 0.35]]
  for (const [x, y, z] of positions) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.z = Math.PI / 2
    w.position.set(x, y, z)
    g.add(w)
  }
  g.add(body, cabin, windshield, rearWin)
  return g
}

// ── Registry ──────────────────────────────────────────────────────────────────
export function buildMesh(type: ItemType): THREE.Group {
  switch (type) {
    case 'grass':         return groundTile(0x4ade80)
    case 'dirt':          return groundTile(0xa16207)
    case 'sand':          return groundTile(0xfde68a)
    case 'water':         return waterTile()
    case 'snow':          return groundTile(0xe0f2fe)
    case 'road_straight': return roadStraight()
    case 'road_corner':   return roadCorner()
    case 'road_t':        return roadT()
    case 'road_cross':    return roadCross()
    case 'sidewalk':      return sidewalk()
    case 'tree':          return tree()
    case 'pine':          return pine()
    case 'bush':          return bush()
    case 'rock':          return rock()
    case 'flower':        return flower()
    case 'wall':          return wall()
    case 'wall_window':   return wallWindow()
    case 'wall_door':     return wallDoor()
    case 'roof':          return roof()
    case 'floor_wood':    return floorWood()
    case 'floor_tile':    return floorTile()
    case 'street_lamp':   return streetLamp()
    case 'fence':         return fence()
    case 'bench':         return bench()
    case 'mailbox':       return mailbox()
    case 'car_red':       return car(0xef4444)
    case 'car_blue':      return car(0x3b82f6)
    case 'car_yellow':    return car(0xeab308)
    default:              return groundTile(0x888888)
  }
}
