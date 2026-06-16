import * as THREE from 'three'
import { WorldGrid } from './WorldGrid'
import { DayNightCycle } from './DayNightCycle'
import { CarSystem } from './CarSystem'
import type { ItemType } from './items'
import { VEHICLE_TYPES } from './items'
import { buildMesh } from './meshBuilders'

const CELL = 2

export interface PlacementMode {
  type: ItemType
  rotation: number
}

export class GameEngine {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  grid: WorldGrid
  dayNight: DayNightCycle
  carSystem: CarSystem

  private rafId = 0
  private lastTime = 0
  private keys = new Set<string>()
  private mouse = new THREE.Vector2()
  private raycaster = new THREE.Raycaster()
  private ghostMesh: THREE.Group | null = null
  private currentGhostType: ItemType | null = null
  private isPlacing = false
  private isRemoving = false
  private canvas: HTMLCanvasElement

  // Camera movement
  private camTarget = new THREE.Vector3(0, 0, 0)
  private camRadius = 20
  private camTheta = Math.PI / 4 // horizontal angle
  private camPhi = Math.PI / 3.5 // vertical angle

  // Callbacks
  onTimeUpdate?: (t: string) => void
  onHoverCell?: (gx: number | null, gz: number | null) => void

  placement: PlacementMode = { type: 'grass', rotation: 0 }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 300)
    this.updateCamera()

    this.grid = new WorldGrid(this.scene)
    this.dayNight = new DayNightCycle(this.scene, this.renderer)
    this.carSystem = new CarSystem(this.grid)

    this.bindEvents()
    this.start()
  }

  private updateCamera() {
    const x = this.camTarget.x + this.camRadius * Math.sin(this.camTheta) * Math.cos(this.camPhi)
    const y = this.camRadius * Math.sin(this.camPhi)
    const z = this.camTarget.z + this.camRadius * Math.cos(this.camTheta) * Math.cos(this.camPhi)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(this.camTarget)
  }

  private bindEvents() {
    const c = this.canvas

    window.addEventListener('keydown', e => this.keys.add(e.key.toLowerCase()))
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()))

    c.addEventListener('mousemove', e => {
      const rect = c.getBoundingClientRect()
      this.mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
    })

    c.addEventListener('mousedown', e => {
      if (e.button === 0) this.isPlacing = true
      if (e.button === 2) this.isRemoving = true
    })
    c.addEventListener('mouseup', e => {
      if (e.button === 0) this.isPlacing = false
      if (e.button === 2) this.isRemoving = false
    })
    c.addEventListener('contextmenu', e => e.preventDefault())

    // Orbit with right drag (or middle)
    let dragging = false
    let lastX = 0, lastY = 0
    c.addEventListener('mousedown', e => {
      if (e.button === 1 || (e.button === 2 && e.altKey)) {
        dragging = true; lastX = e.clientX; lastY = e.clientY
      }
    })
    window.addEventListener('mousemove', e => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      this.camTheta -= dx * 0.005
      this.camPhi = Math.max(0.2, Math.min(Math.PI / 2.2, this.camPhi - dy * 0.005))
      lastX = e.clientX; lastY = e.clientY
      this.updateCamera()
    })
    window.addEventListener('mouseup', () => { dragging = false })

    c.addEventListener('wheel', e => {
      this.camRadius = Math.max(5, Math.min(60, this.camRadius + e.deltaY * 0.04))
      this.updateCamera()
    })

    window.addEventListener('resize', () => {
      this.renderer.setSize(c.clientWidth, c.clientHeight)
      this.camera.aspect = c.clientWidth / c.clientHeight
      this.camera.updateProjectionMatrix()
    })
  }

  private getGroundIntersect(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(plane, target)
    return target
  }

  private worldToGrid(wx: number, wz: number): [number, number] {
    return [Math.round(wx / CELL), Math.round(wz / CELL)]
  }

  private updateGhost(gx: number, gz: number) {
    if (this.currentGhostType !== this.placement.type) {
      if (this.ghostMesh) { this.scene.remove(this.ghostMesh) }
      this.ghostMesh = buildMesh(this.placement.type)
      this.ghostMesh.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          const m = c as THREE.Mesh
          if (Array.isArray(m.material)) {
            m.material = m.material.map(mt => {
              const clone = (mt as THREE.Material).clone() as THREE.MeshLambertMaterial
              clone.transparent = true; clone.opacity = 0.55
              return clone
            })
          } else {
            const clone = (m.material as THREE.Material).clone() as THREE.MeshLambertMaterial
            clone.transparent = true; clone.opacity = 0.55
            m.material = clone
          }
        }
      })
      this.scene.add(this.ghostMesh)
      this.currentGhostType = this.placement.type
    }
    if (this.ghostMesh) {
      this.ghostMesh.position.set(gx * CELL, 0, gz * CELL)
      this.ghostMesh.rotation.y = this.placement.rotation * (Math.PI / 2)
    }
  }

  private tick = (time: number) => {
    this.rafId = requestAnimationFrame(this.tick)
    const delta = time - this.lastTime
    this.lastTime = time

    // Camera WASD
    const speed = 0.12
    const fwd = new THREE.Vector3(Math.sin(this.camTheta), 0, Math.cos(this.camTheta))
    const right = new THREE.Vector3(Math.cos(this.camTheta), 0, -Math.sin(this.camTheta))
    if (this.keys.has('z') || this.keys.has('arrowup'))    this.camTarget.addScaledVector(fwd, -speed)
    if (this.keys.has('s') || this.keys.has('arrowdown'))  this.camTarget.addScaledVector(fwd, speed)
    if (this.keys.has('q') || this.keys.has('arrowleft'))  this.camTarget.addScaledVector(right, -speed)
    if (this.keys.has('d') || this.keys.has('arrowright')) this.camTarget.addScaledVector(right, speed)
    if (this.keys.has('z') || this.keys.has('s') || this.keys.has('q') || this.keys.has('d') ||
        this.keys.has('arrowup') || this.keys.has('arrowdown') || this.keys.has('arrowleft') || this.keys.has('arrowright')) {
      this.updateCamera()
    }

    // Rotate placement with R
    if (this.keys.has('r')) {
      this.keys.delete('r')
      this.placement.rotation = (this.placement.rotation + 1) % 4
    }

    // Ghost + placement
    const hit = this.getGroundIntersect()
    if (hit) {
      const [gx, gz] = this.worldToGrid(hit.x, hit.z)
      this.updateGhost(gx, gz)
      if (this.isPlacing) {
        this.placeAt(gx, gz)
      } else if (this.isRemoving) {
        this.grid.remove(gx, gz)
      }
    }

    this.dayNight.update(delta)
    this.carSystem.update(delta)

    if (this.onTimeUpdate) this.onTimeUpdate(this.dayNight.getTimeString())

    this.renderer.render(this.scene, this.camera)
  }

  private placeAt(gx: number, gz: number) {
    const type = this.placement.type
    this.grid.place(gx, gz, { type, rotation: this.placement.rotation })

    // If it's a vehicle, register in car system
    if (VEHICLE_TYPES.has(type)) {
      const obj = this.grid.objects.get(`${gx}_${gz}`)
      if (obj) this.carSystem.spawnCar(obj, gx, gz)
    }
  }

  setPlacement(type: ItemType, rotation = 0) {
    this.placement = { type, rotation }
  }

  start() {
    this.rafId = requestAnimationFrame(t => {
      this.lastTime = t
      this.tick(t)
    })
  }

  stop() {
    cancelAnimationFrame(this.rafId)
    if (this.ghostMesh) this.scene.remove(this.ghostMesh)
    this.renderer.dispose()
  }
}
