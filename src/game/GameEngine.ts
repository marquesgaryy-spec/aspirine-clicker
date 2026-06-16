import * as THREE from 'three'
import { WorldGrid } from './WorldGrid'
import { DayNightCycle } from './DayNightCycle'
import { CarSystem } from './CarSystem'
import type { ItemType } from './items'
import { VEHICLE_TYPES, getItemDef } from './items'
import { buildMesh } from './meshBuilders'

const CELL = 2
const PLAYER_HEIGHT = 1.7   // eye height
const PLAYER_RADIUS = 0.38
const WALK_SPEED    = 6
const FLY_SPEED     = 8
const GRAVITY       = 22
const JUMP_VEL      = 9
const MAX_REACH     = 7     // max placement distance

export class GameEngine {
  renderer: THREE.WebGLRenderer
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
  grid:     WorldGrid
  dayNight: DayNightCycle
  carSystem: CarSystem

  private canvas: HTMLCanvasElement
  private rafId  = 0
  private lastTime = 0

  // FPS player state
  private pos   = new THREE.Vector3(0, PLAYER_HEIGHT, 0)
  private yaw   = 0
  private pitch = 0
  private velY  = 0
  private isFlying    = false
  private onGround    = false
  private lastSpaceMs = 0
  private spaceHeld   = false
  private shiftHeld   = false
  private locked      = false  // pointer lock active

  private keys = new Set<string>()

  // Placement
  placement = { type: 'grass' as ItemType, rotation: 0 }
  private ghostMesh: THREE.Group | null = null
  private ghostType: ItemType | null = null
  private pendingPlace  = false
  private pendingRemove = false
  private hitGx: number | null = null
  private hitGz: number | null = null

  onTimeUpdate?: (t: string) => void
  onLockChange?: (locked: boolean) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 300)
    this.camera.position.copy(this.pos)

    this.grid      = new WorldGrid(this.scene)
    this.dayNight  = new DayNightCycle(this.scene, this.renderer)
    this.carSystem = new CarSystem(this.grid)

    this.bindEvents()
    this.start()
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  private bindEvents() {
    const c = this.canvas

    // Pointer lock
    c.addEventListener('click', () => {
      if (!this.locked) c.requestPointerLock()
      else {
        // Place / remove
        if (this.hitGx !== null) this.pendingPlace = true
      }
    })
    c.addEventListener('contextmenu', e => {
      e.preventDefault()
      if (this.locked && this.hitGx !== null) this.pendingRemove = true
    })

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === c
      this.onLockChange?.(this.locked)
    })

    document.addEventListener('mousemove', e => {
      if (!this.locked) return
      this.yaw  -= e.movementX * 0.0022
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch - e.movementY * 0.0022))
    })

    // Place on left click while locked
    c.addEventListener('mousedown', e => {
      if (!this.locked) return
      if (e.button === 0) this.pendingPlace  = true
      if (e.button === 2) this.pendingRemove = true
    })

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase()
      this.keys.add(k)

      if (k === ' ') {
        e.preventDefault()
        this.spaceHeld = true
        const now = Date.now()
        if (now - this.lastSpaceMs < 300) {
          this.isFlying = !this.isFlying
          this.velY = 0
        } else if (!this.isFlying && this.onGround) {
          this.velY = JUMP_VEL
          this.onGround = false
        }
        this.lastSpaceMs = now
      }
      if (k === 'shift') this.shiftHeld = true
      if (k === 'r') {
        this.keys.delete('r')
        this.placement.rotation = (this.placement.rotation + 1) % 4
      }
    })

    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase()
      this.keys.delete(k)
      if (k === ' ')     this.spaceHeld = false
      if (k === 'shift') this.shiftHeld = false
    })

    // Scroll = nothing (zoom removed, FPS mode)
    c.addEventListener('wheel', e => { e.preventDefault() }, { passive: false })

    window.addEventListener('resize', () => {
      this.renderer.setSize(c.clientWidth, c.clientHeight)
      this.camera.aspect = c.clientWidth / c.clientHeight
      this.camera.updateProjectionMatrix()
    })
  }

  // ── Tick ────────────────────────────────────────────────────────────────────

  private tick = (now: number) => {
    this.rafId = requestAnimationFrame(this.tick)
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now

    this.movePlayer(dt)
    this.updateCamera()
    this.updateGhost()

    if (this.pendingPlace)  { this.doPlace();  this.pendingPlace  = false }
    if (this.pendingRemove) { this.doRemove(); this.pendingRemove = false }

    this.dayNight.update(dt * 1000)
    this.carSystem.update(dt * 1000)
    if (this.onTimeUpdate) this.onTimeUpdate(this.dayNight.getTimeString())

    this.renderer.render(this.scene, this.camera)
  }

  // ── Movement ────────────────────────────────────────────────────────────────

  private movePlayer(dt: number) {
    const fwd   = new THREE.Vector3( Math.sin(this.yaw), 0, Math.cos(this.yaw))
    const right = new THREE.Vector3( Math.cos(this.yaw), 0,-Math.sin(this.yaw))

    let dx = 0, dz = 0
    if (this.keys.has('z') || this.keys.has('w') || this.keys.has('arrowup'))    { dx -= fwd.x;   dz -= fwd.z   }
    if (this.keys.has('s') || this.keys.has('arrowdown'))                         { dx += fwd.x;   dz += fwd.z   }
    if (this.keys.has('q') || this.keys.has('a') || this.keys.has('arrowleft'))  { dx -= right.x; dz -= right.z }
    if (this.keys.has('d') || this.keys.has('arrowright'))                        { dx += right.x; dz += right.z }

    const len = Math.sqrt(dx * dx + dz * dz)
    if (len > 0) { dx /= len; dz /= len }

    const speed = this.isFlying ? FLY_SPEED : WALK_SPEED
    dx *= speed * dt
    dz *= speed * dt

    if (this.isFlying) {
      if (this.spaceHeld) this.pos.y += FLY_SPEED * dt
      if (this.shiftHeld) this.pos.y -= FLY_SPEED * dt
    } else {
      this.velY -= GRAVITY * dt
      this.pos.y += this.velY * dt
      const ground = PLAYER_HEIGHT
      if (this.pos.y <= ground) {
        this.pos.y  = ground
        this.velY   = 0
        this.onGround = true
      } else {
        this.onGround = false
      }
    }

    // XZ collision
    const nx = this.pos.x + dx
    const nz = this.pos.z + dz
    if (!this.collidesAt(nx, this.pos.z)) this.pos.x = nx
    if (!this.collidesAt(this.pos.x, nz)) this.pos.z = nz
  }

  private collidesAt(x: number, z: number): boolean {
    // Check corners of player AABB
    for (const [cx, cz] of [
      [x - PLAYER_RADIUS, z - PLAYER_RADIUS],
      [x + PLAYER_RADIUS, z - PLAYER_RADIUS],
      [x - PLAYER_RADIUS, z + PLAYER_RADIUS],
      [x + PLAYER_RADIUS, z + PLAYER_RADIUS],
    ]) {
      const gx = Math.round(cx / CELL)
      const gz = Math.round(cz / CELL)
      if (this.grid.isSolid(gx, gz)) return true
    }
    return false
  }

  // ── Camera ──────────────────────────────────────────────────────────────────

  private updateCamera() {
    this.camera.position.copy(this.pos)
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    )
    this.camera.lookAt(this.pos.clone().add(dir))
  }

  // ── Ghost / placement ───────────────────────────────────────────────────────

  private getCamDir(): THREE.Vector3 {
    return new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize()
  }

  private getPlacementCell(): [number, number] | null {
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit   = new THREE.Vector3()
    ray.ray.intersectPlane(plane, hit)

    if (!hit) return null
    const dist = this.pos.distanceTo(hit)
    if (dist > MAX_REACH || dist < 0.5) return null

    return [Math.round(hit.x / CELL), Math.round(hit.z / CELL)]
  }

  private updateGhost() {
    const cell = this.getPlacementCell()
    if (!cell) {
      if (this.ghostMesh) this.ghostMesh.visible = false
      this.hitGx = null; this.hitGz = null
      return
    }
    const [gx, gz] = cell
    this.hitGx = gx; this.hitGz = gz

    if (this.ghostType !== this.placement.type) {
      if (this.ghostMesh) this.scene.remove(this.ghostMesh)
      this.ghostMesh = buildMesh(this.placement.type)
      this.ghostMesh.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          const m  = c as THREE.Mesh
          const mt = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshLambertMaterial
          const cl = mt.clone()
          cl.transparent = true; cl.opacity = 0.5
          m.material = cl
        }
      })
      this.scene.add(this.ghostMesh)
      this.ghostType = this.placement.type
    }
    if (this.ghostMesh) {
      const def = getItemDef(this.placement.type)
      const yOff = def.layer === 1 && this.placement.type === 'roof' ? 1.4 : 0
      this.ghostMesh.position.set(gx * CELL, yOff, gz * CELL)
      this.ghostMesh.rotation.y = this.placement.rotation * (Math.PI / 2)
      this.ghostMesh.visible = true
    }
  }

  private doPlace() {
    if (this.hitGx === null || this.hitGz === null) return
    const type = this.placement.type
    this.grid.place(this.hitGx, this.hitGz, { type, rotation: this.placement.rotation })
    if (VEHICLE_TYPES.has(type)) {
      const mesh = this.grid.getMeshAt(this.hitGx, this.hitGz, 1)
      if (mesh) this.carSystem.spawnCar(mesh, this.hitGx, this.hitGz)
    }
  }

  private doRemove() {
    if (this.hitGx === null || this.hitGz === null) return
    this.grid.remove(this.hitGx, this.hitGz)
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  setPlacement(type: ItemType) {
    this.placement = { type, rotation: this.placement.rotation }
  }

  isNight(): boolean { return this.dayNight.isNight() }

  start() {
    this.rafId = requestAnimationFrame(t => { this.lastTime = t; this.tick(t) })
  }

  stop() {
    cancelAnimationFrame(this.rafId)
    if (this.ghostMesh) this.scene.remove(this.ghostMesh)
    this.renderer.dispose()
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
  }
}
