import * as THREE from 'three'
import type { ItemType } from './items'
import { buildMesh } from './meshBuilders'
import { ROAD_TYPES, VEHICLE_TYPES } from './items'

const CELL = 2

export interface CellData {
  type: ItemType
  rotation: number // 0 | 1 | 2 | 3  (× 90°)
}

export interface WorldData {
  cells: Record<string, CellData>
}

function key(gx: number, gz: number): string {
  return `${gx}_${gz}`
}

function worldPos(gx: number, gz: number): [number, number, number] {
  return [gx * CELL, 0, gz * CELL]
}

export class WorldGrid {
  cells: Map<string, CellData> = new Map()
  objects: Map<string, THREE.Group> = new Map()
  scene: THREE.Scene

  // Road cell lookup for car system
  isRoad(gx: number, gz: number): boolean {
    const c = this.cells.get(key(gx, gz))
    return !!c && ROAD_TYPES.has(c.type)
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.buildDefaultGround()
  }

  private buildDefaultGround() {
    // 40×40 grass base
    for (let x = -20; x <= 20; x++) {
      for (let z = -20; z <= 20; z++) {
        this.place(x, z, { type: 'grass', rotation: 0 }, false)
      }
    }
  }

  place(gx: number, gz: number, data: CellData, notify = true): void {
    const k = key(gx, gz)
    this.remove(gx, gz)

    this.cells.set(k, data)
    const group = buildMesh(data.type)
    const [wx, , wz] = worldPos(gx, gz)
    group.position.set(wx, 0, wz)
    group.rotation.y = data.rotation * (Math.PI / 2)
    group.userData = { gx, gz, type: data.type, isWorldObject: true }
    this.scene.add(group)
    this.objects.set(k, group)
  }

  remove(gx: number, gz: number): void {
    const k = key(gx, gz)
    const obj = this.objects.get(k)
    if (obj) {
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
    }
    this.cells.delete(k)
  }

  getAdjacentRoads(gx: number, gz: number): Array<{ gx: number; gz: number }> {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
    return dirs
      .filter(([dx,dz]) => this.isRoad(gx+dx, gz+dz))
      .map(([dx,dz]) => ({ gx: gx+dx, gz: gz+dz }))
  }

  serialize(): WorldData {
    const cells: Record<string, CellData> = {}
    this.cells.forEach((v, k) => { cells[k] = v })
    return { cells }
  }

  loadFromData(data: WorldData): void {
    // Clear all
    this.objects.forEach((_, k) => {
      const [gxs, gzs] = k.split('_')
      this.remove(parseInt(gxs), parseInt(gzs))
    })
    this.cells.clear()
    // Rebuild
    Object.entries(data.cells).forEach(([k, cell]) => {
      const [gxs, gzs] = k.split('_')
      this.place(parseInt(gxs), parseInt(gzs), cell, false)
    })
  }

  getVehicleCells(): Array<{ gx: number; gz: number; type: ItemType }> {
    const result: Array<{ gx: number; gz: number; type: ItemType }> = []
    this.cells.forEach((cell, k) => {
      if (VEHICLE_TYPES.has(cell.type)) {
        const [gxs, gzs] = k.split('_')
        result.push({ gx: parseInt(gxs), gz: parseInt(gzs), type: cell.type })
      }
    })
    return result
  }
}
