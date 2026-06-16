import * as THREE from 'three'

// Sky colors for different times
const SKY_COLORS = [
  { t: 0,    sky: 0x0a0a2e, amb: 0x111133 }, // minuit
  { t: 0.2,  sky: 0x0a0a2e, amb: 0x111133 }, // 4h
  { t: 0.25, sky: 0xff6b35, amb: 0x664422 }, // lever soleil
  { t: 0.3,  sky: 0x87ceeb, amb: 0x8899aa }, // matin
  { t: 0.5,  sky: 0x4a90d9, amb: 0x9999cc }, // midi
  { t: 0.7,  sky: 0x87ceeb, amb: 0x8899aa }, // après-midi
  { t: 0.75, sky: 0xff6b35, amb: 0x664422 }, // coucher
  { t: 0.8,  sky: 0x1a1a3e, amb: 0x111133 }, // crépuscule
  { t: 1.0,  sky: 0x0a0a2e, amb: 0x111133 }, // nuit
]

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}

function getSkyColor(progress: number): { sky: number; amb: number } {
  for (let i = 1; i < SKY_COLORS.length; i++) {
    const prev = SKY_COLORS[i - 1]
    const next = SKY_COLORS[i]
    if (progress <= next.t) {
      const t = (progress - prev.t) / (next.t - prev.t)
      return {
        sky: lerpColor(prev.sky, next.sky, t),
        amb: lerpColor(prev.amb, next.amb, t),
      }
    }
  }
  return SKY_COLORS[SKY_COLORS.length - 1]
}

export class DayNightCycle {
  sun: THREE.DirectionalLight
  ambient: THREE.AmbientLight
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer

  // Game time: 0-24 in real hours representation
  // 1 real second = 1 game minute → full day = 24 minutes
  private gameMinutes = 8 * 60 // start at 8h00

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer

    this.sun = new THREE.DirectionalLight(0xffffff, 1.0)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 200
    this.sun.shadow.camera.left = -60
    this.sun.shadow.camera.right = 60
    this.sun.shadow.camera.top = 60
    this.sun.shadow.camera.bottom = -60
    scene.add(this.sun)

    this.ambient = new THREE.AmbientLight(0x9999cc, 0.6)
    scene.add(this.ambient)
  }

  update(deltaMs: number) {
    // 1 real second = 1 game minute
    this.gameMinutes = (this.gameMinutes + deltaMs / 1000) % (24 * 60)
    const progress = this.gameMinutes / (24 * 60)

    // Sun position: arc from east to west
    const angle = progress * Math.PI * 2 - Math.PI / 2
    const radius = 80
    this.sun.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      20
    )
    this.sun.target.position.set(0, 0, 0)
    this.sun.target.updateMatrixWorld()

    // Is it day?
    const isDaytime = progress > 0.25 && progress < 0.75
    this.sun.intensity = isDaytime
      ? Math.sin((progress - 0.25) / 0.5 * Math.PI) * 1.2
      : 0.02

    const { sky, amb } = getSkyColor(progress)
    this.scene.background = new THREE.Color(sky)
    this.scene.fog = new THREE.Fog(sky, 60, 150)
    this.ambient.color.set(amb)
    this.ambient.intensity = isDaytime ? 0.6 : 0.25
  }

  getTimeString(): string {
    const h = Math.floor(this.gameMinutes / 60) % 24
    const m = Math.floor(this.gameMinutes % 60)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }

  isNight(): boolean {
    const p = this.gameMinutes / (24 * 60)
    return p < 0.25 || p > 0.75
  }
}
