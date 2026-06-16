import * as THREE from 'three'
import type { WorldGrid } from './WorldGrid'

const CELL = 2
const CAR_SPEED = 2.5 // units per second

interface CarAgent {
  mesh: THREE.Group
  gx: number
  gz: number
  targetGx: number
  targetGz: number
  progress: number // 0-1 between current and target
  dirX: number
  dirZ: number
}

export class CarSystem {
  agents: CarAgent[] = []
  grid: WorldGrid

  constructor(grid: WorldGrid) {
    this.grid = grid
  }

  spawnCar(mesh: THREE.Group, gx: number, gz: number) {
    const roads = this.grid.getAdjacentRoads(gx, gz)
    const first = roads[0] || { gx, gz }
    const agent: CarAgent = {
      mesh,
      gx,
      gz,
      targetGx: first.gx,
      targetGz: first.gz,
      progress: 0,
      dirX: first.gx - gx,
      dirZ: first.gz - gz,
    }
    this.agents.push(agent)
  }

  removeAt(gx: number, gz: number) {
    this.agents = this.agents.filter(a => !(a.gx === gx && a.gz === gz))
  }

  update(deltaMs: number) {
    const dt = deltaMs / 1000
    for (const agent of this.agents) {
      agent.progress += (CAR_SPEED / CELL) * dt
      if (agent.progress >= 1) {
        agent.progress = 0
        agent.gx = agent.targetGx
        agent.gz = agent.targetGz
        this.chooseNext(agent)
      }
      // Lerp position
      const wx = agent.gx * CELL + agent.dirX * CELL * agent.progress
      const wz = agent.gz * CELL + agent.dirZ * CELL * agent.progress
      agent.mesh.position.set(wx, 0, wz)
      // Face direction
      if (agent.dirX !== 0 || agent.dirZ !== 0) {
        agent.mesh.rotation.y = Math.atan2(agent.dirX, agent.dirZ)
      }
    }
  }

  private chooseNext(agent: CarAgent) {
    const neighbors = this.grid.getAdjacentRoads(agent.gx, agent.gz)
    if (neighbors.length === 0) {
      // No road? stay
      agent.targetGx = agent.gx
      agent.targetGz = agent.gz
      agent.dirX = 0
      agent.dirZ = 0
      return
    }
    // Prefer to continue straight; avoid going back unless no choice
    const straight = neighbors.find(n =>
      n.gx - agent.gx === agent.dirX && n.gz - agent.gz === agent.dirZ
    )
    const notBack = neighbors.filter(n =>
      !(n.gx - agent.gx === -agent.dirX && n.gz - agent.gz === -agent.dirZ)
    )
    const next = straight ?? (notBack.length > 0 ? notBack[Math.floor(Math.random() * notBack.length)] : neighbors[0])
    agent.dirX = next.gx - agent.gx
    agent.dirZ = next.gz - agent.gz
    agent.targetGx = next.gx
    agent.targetGz = next.gz
  }
}
