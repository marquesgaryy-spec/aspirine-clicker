import * as THREE from 'three'
import type { ItemType } from './items'
import { buildMesh } from './meshBuilders'
import { ROAD_TYPES, VEHICLE_TYPES, SOLID_TYPES, GROUND_TYPES, getItemDef } from './items'

const CELL = 2

export interface CellData {
  type: ItemType
  rotation: number
}

export interface WorldData {
  cells: Record<string, CellData>  // key = `${layer}_${gx}_${gz}`
}

function cellKey(layer: number, gx: number, gz: number): string {
  return `${layer}_${gx}_${gz}`
}

function worldXZ(gx: number, gz: number): [number, number] {
  return [gx * CELL, gz * CELL]
}

// Y offset for objects in layer 1 based on what's below them
function getLayerYOffset(type: ItemType, layer: number): number {
  if (layer === 0) return 0
  // Roofs sit on top of walls (wall height ≈ 1.4)
  if (type === 'roof') return 1.4
  return 0
}

export class WorldGrid {
  cells: Map<string, CellData> = new Map()
  objects: Map<string, THREE.Group> = new Map()
  scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.buildDefaultGround()
  }

  private buildDefaultGround() {
    for (let x = -25; x <= 25; x++) {
      for (let z = -25; z <= 25; z++) {
        this.place(x, z, { type: 'grass', rotation: 0 })
      }
    }
  }

  place(gx: number, gz: number, data: CellData): void {
    const def = getItemDef(data.type)
    const layer = def.layer
    const k = cellKey(layer, gx, gz)

    // Remove existing object in same layer
    this.removeByKey(k)

    this.cells.set(k, data)
    const group = buildMesh(data.type)
    const [wx, wz] = worldXZ(gx, gz)
    const yOff = getLayerYOffset(data.type, layer)
    group.position.set(wx, yOff, wz)
    group.rotation.y = data.rotation * (Math.PI / 2)
    group.userData = { layer, gx, gz, type: data.type }
    this.scene.add(group)
    this.objects.set(k, group)
  }

  remove(gx: number, gz: number): void {
    // Remove layer 1 first, if empty remove layer 0
    const k1 = cellKey(1, gx, gz)
    if (this.objects.has(k1)) {
      this.removeByKey(k1)
    } else {
      const k0 = cellKey(0, gx, gz)
      this.removeByKey(k0)
    }
  }

  private removeByKey(k: string): void {
    const obj = this.objects.get(k)
    if (!obj) return
    this.scene.remove(obj)
    obj.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh
        m.geometry.dispose()
        if (Array.isArray(m.material)) m.material.forEach(mt => mt.dispose())
        else (m.material as THREE.Material).dispose()
      }
    })
    this.objects.delete(k)
    this.cells.delete(k)
  }

  isRoad(gx: number, gz: number): boolean {
    const c = this.cells.get(cellKey(0, gx, gz))
    return !!c && ROAD_TYPES.has(c.type)
  }

  isSolid(gx: number, gz: number): boolean {
    const c = this.cells.get(cellKey(1, gx, gz))
    return !!c && SOLID_TYPES.has(c.type)
  }

  getAdjacentRoads(gx: number, gz: number): Array<{ gx: number; gz: number }> {
    return [[1,0],[-1,0],[0,1],[0,-1]]
      .filter(([dx,dz]) => this.isRoad(gx+dx, gz+dz))
      .map(([dx,dz]) => ({ gx: gx+dx, gz: gz+dz }))
  }

  getMeshAt(gx: number, gz: number, layer = 1): THREE.Group | undefined {
    return this.objects.get(cellKey(layer, gx, gz))
  }

  serialize(): WorldData {
    const cells: Record<string, CellData> = {}
    this.cells.forEach((v, k) => { cells[k] = v })
    return { cells }
  }

  loadFromData(data: WorldData): void {
    // Clear everything
    const keys = [...this.objects.keys()]
    for (const k of keys) this.removeByKey(k)
    this.cells.clear()

    Object.entries(data.cells).forEach(([k, cell]) => {
      const parts = k.split('_')
      // Support old format "gx_gz" (no layer) and new "layer_gx_gz"
      let gx: number, gz: number
      if (parts.length === 2) {
        gx = parseInt(parts[0]); gz = parseInt(parts[1])
      } else {
        gx = parseInt(parts[1]); gz = parseInt(parts[2])
      }
      this.place(gx, gz, cell)
    })
  }

  getVehicleCells(): Array<{ gx: number; gz: number; type: ItemType }> {
    const result: Array<{ gx: number; gz: number; type: ItemType }> = []
    this.cells.forEach((cell, k) => {
      if (VEHICLE_TYPES.has(cell.type)) {
        const parts = k.split('_')
        const gx = parseInt(parts[1])
        const gz = parseInt(parts[2])
        result.push({ gx, gz, type: cell.type })
      }
    })
    return result
  }
}
