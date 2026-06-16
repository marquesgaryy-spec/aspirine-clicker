export type ItemType =
  | 'grass' | 'dirt' | 'sand' | 'water' | 'snow'
  | 'road_straight' | 'road_corner' | 'road_t' | 'road_cross' | 'sidewalk'
  | 'tree' | 'pine' | 'bush' | 'rock' | 'flower'
  | 'wall' | 'wall_window' | 'wall_door' | 'roof' | 'floor_wood' | 'floor_tile'
  | 'street_lamp' | 'fence' | 'bench' | 'mailbox'
  | 'car_red' | 'car_blue' | 'car_yellow'

export interface ItemDef {
  type: ItemType
  label: string
  emoji: string
  category: 'ground' | 'road' | 'nature' | 'building' | 'deco' | 'vehicle'
  color: string
  layer: 0 | 1    // 0 = ground tile, 1 = object placed on top
  solid: boolean  // blocks player movement
}

export const ITEMS: ItemDef[] = [
  { type: 'grass',         label: 'Herbe',        emoji: '🌿', category: 'ground',   color: '#4ade80', layer: 0, solid: false },
  { type: 'dirt',          label: 'Terre',         emoji: '🟫', category: 'ground',   color: '#a16207', layer: 0, solid: false },
  { type: 'sand',          label: 'Sable',         emoji: '🏖️', category: 'ground',   color: '#fde68a', layer: 0, solid: false },
  { type: 'water',         label: 'Eau',           emoji: '💧', category: 'ground',   color: '#38bdf8', layer: 0, solid: false },
  { type: 'snow',          label: 'Neige',         emoji: '❄️', category: 'ground',   color: '#e0f2fe', layer: 0, solid: false },
  { type: 'road_straight', label: 'Route droite',  emoji: '🛣️', category: 'road',     color: '#374151', layer: 0, solid: false },
  { type: 'road_corner',   label: 'Route virage',  emoji: '↩️', category: 'road',     color: '#374151', layer: 0, solid: false },
  { type: 'road_t',        label: 'Route T',       emoji: '⊤',  category: 'road',     color: '#374151', layer: 0, solid: false },
  { type: 'road_cross',    label: 'Carrefour',     emoji: '✛',  category: 'road',     color: '#374151', layer: 0, solid: false },
  { type: 'sidewalk',      label: 'Trottoir',      emoji: '⬜', category: 'road',     color: '#d1d5db', layer: 0, solid: false },
  { type: 'floor_wood',    label: 'Plancher',      emoji: '🟫', category: 'ground',   color: '#d97706', layer: 0, solid: false },
  { type: 'floor_tile',    label: 'Carrelage',     emoji: '⬜', category: 'ground',   color: '#f1f5f9', layer: 0, solid: false },
  { type: 'tree',          label: 'Arbre',         emoji: '🌳', category: 'nature',   color: '#15803d', layer: 1, solid: true  },
  { type: 'pine',          label: 'Sapin',         emoji: '🌲', category: 'nature',   color: '#166534', layer: 1, solid: true  },
  { type: 'bush',          label: 'Buisson',       emoji: '🌿', category: 'nature',   color: '#22c55e', layer: 1, solid: false },
  { type: 'rock',          label: 'Rocher',        emoji: '🪨', category: 'nature',   color: '#9ca3af', layer: 1, solid: true  },
  { type: 'flower',        label: 'Fleur',         emoji: '🌸', category: 'nature',   color: '#f9a8d4', layer: 1, solid: false },
  { type: 'wall',          label: 'Mur',           emoji: '🧱', category: 'building', color: '#b45309', layer: 1, solid: true  },
  { type: 'wall_window',   label: 'Mur fenêtre',   emoji: '🪟', category: 'building', color: '#b45309', layer: 1, solid: true  },
  { type: 'wall_door',     label: 'Porte',         emoji: '🚪', category: 'building', color: '#92400e', layer: 1, solid: true  },
  { type: 'roof',          label: 'Toit',          emoji: '🏠', category: 'building', color: '#dc2626', layer: 1, solid: false },
  { type: 'street_lamp',   label: 'Lampadaire',    emoji: '💡', category: 'deco',     color: '#fbbf24', layer: 1, solid: true  },
  { type: 'fence',         label: 'Clôture',       emoji: '🚧', category: 'deco',     color: '#d97706', layer: 1, solid: true  },
  { type: 'bench',         label: 'Banc',          emoji: '🪑', category: 'deco',     color: '#92400e', layer: 1, solid: false },
  { type: 'mailbox',       label: 'Boîte aux L.',  emoji: '📮', category: 'deco',     color: '#dc2626', layer: 1, solid: false },
  { type: 'car_red',       label: 'Voiture rouge', emoji: '🚗', category: 'vehicle',  color: '#ef4444', layer: 1, solid: false },
  { type: 'car_blue',      label: 'Voiture bleue', emoji: '🚙', category: 'vehicle',  color: '#3b82f6', layer: 1, solid: false },
  { type: 'car_yellow',    label: 'Taxi',          emoji: '🚕', category: 'vehicle',  color: '#eab308', layer: 1, solid: false },
]

export const CATEGORIES = [
  { id: 'ground',   label: 'Sol',       emoji: '🌍' },
  { id: 'road',     label: 'Routes',    emoji: '🛣️' },
  { id: 'nature',   label: 'Nature',    emoji: '🌳' },
  { id: 'building', label: 'Bâtiment', emoji: '🏠' },
  { id: 'deco',     label: 'Déco',      emoji: '✨' },
  { id: 'vehicle',  label: 'Véhicules', emoji: '🚗' },
] as const

export function getItemDef(type: ItemType): ItemDef {
  return ITEMS.find(i => i.type === type)!
}

export const ROAD_TYPES    = new Set<ItemType>(['road_straight','road_corner','road_t','road_cross'])
export const VEHICLE_TYPES = new Set<ItemType>(['car_red','car_blue','car_yellow'])
export const SOLID_TYPES   = new Set<ItemType>(ITEMS.filter(i => i.solid).map(i => i.type))
export const GROUND_TYPES  = new Set<ItemType>(ITEMS.filter(i => i.layer === 0).map(i => i.type))
