export type ItemType =
  // Sol
  | 'grass' | 'dirt' | 'sand' | 'water' | 'snow'
  // Routes
  | 'road_straight' | 'road_corner' | 'road_t' | 'road_cross' | 'sidewalk'
  // Nature
  | 'tree' | 'pine' | 'bush' | 'rock' | 'flower'
  // Bâtiments
  | 'wall' | 'wall_window' | 'wall_door' | 'roof' | 'floor_wood' | 'floor_tile'
  // Déco
  | 'street_lamp' | 'fence' | 'bench' | 'mailbox'
  // Véhicules
  | 'car_red' | 'car_blue' | 'car_yellow'

export interface ItemDef {
  type: ItemType
  label: string
  emoji: string
  category: 'ground' | 'road' | 'nature' | 'building' | 'deco' | 'vehicle'
  color: string
}

export const ITEMS: ItemDef[] = [
  // Ground
  { type: 'grass',         label: 'Herbe',       emoji: '🌿', category: 'ground',   color: '#4ade80' },
  { type: 'dirt',          label: 'Terre',        emoji: '🟫', category: 'ground',   color: '#a16207' },
  { type: 'sand',          label: 'Sable',        emoji: '🏖️', category: 'ground',   color: '#fde68a' },
  { type: 'water',         label: 'Eau',          emoji: '💧', category: 'ground',   color: '#38bdf8' },
  { type: 'snow',          label: 'Neige',        emoji: '❄️', category: 'ground',   color: '#e0f2fe' },
  // Road
  { type: 'road_straight', label: 'Route droite', emoji: '🛣️', category: 'road',     color: '#374151' },
  { type: 'road_corner',   label: 'Route virage', emoji: '↩️', category: 'road',     color: '#374151' },
  { type: 'road_t',        label: 'Route T',      emoji: '⊤',  category: 'road',     color: '#374151' },
  { type: 'road_cross',    label: 'Carrefour',    emoji: '✛',  category: 'road',     color: '#374151' },
  { type: 'sidewalk',      label: 'Trottoir',     emoji: '⬜', category: 'road',     color: '#d1d5db' },
  // Nature
  { type: 'tree',          label: 'Arbre',        emoji: '🌳', category: 'nature',   color: '#15803d' },
  { type: 'pine',          label: 'Sapin',        emoji: '🌲', category: 'nature',   color: '#166534' },
  { type: 'bush',          label: 'Buisson',      emoji: '🌿', category: 'nature',   color: '#22c55e' },
  { type: 'rock',          label: 'Rocher',       emoji: '🪨', category: 'nature',   color: '#9ca3af' },
  { type: 'flower',        label: 'Fleur',        emoji: '🌸', category: 'nature',   color: '#f9a8d4' },
  // Building
  { type: 'wall',          label: 'Mur',          emoji: '🧱', category: 'building', color: '#b45309' },
  { type: 'wall_window',   label: 'Mur fenêtre',  emoji: '🪟', category: 'building', color: '#b45309' },
  { type: 'wall_door',     label: 'Mur porte',    emoji: '🚪', category: 'building', color: '#92400e' },
  { type: 'roof',          label: 'Toit',         emoji: '🏠', category: 'building', color: '#dc2626' },
  { type: 'floor_wood',    label: 'Plancher',     emoji: '🟫', category: 'building', color: '#d97706' },
  { type: 'floor_tile',    label: 'Carrelage',    emoji: '⬜', category: 'building', color: '#f1f5f9' },
  // Deco
  { type: 'street_lamp',   label: 'Lampadaire',   emoji: '💡', category: 'deco',     color: '#fbbf24' },
  { type: 'fence',         label: 'Clôture',      emoji: '🚧', category: 'deco',     color: '#d97706' },
  { type: 'bench',         label: 'Banc',         emoji: '🪑', category: 'deco',     color: '#92400e' },
  { type: 'mailbox',       label: 'Boîte aux lettres', emoji: '📮', category: 'deco', color: '#dc2626' },
  // Vehicles
  { type: 'car_red',       label: 'Voiture rouge', emoji: '🚗', category: 'vehicle', color: '#ef4444' },
  { type: 'car_blue',      label: 'Voiture bleue', emoji: '🚙', category: 'vehicle', color: '#3b82f6' },
  { type: 'car_yellow',    label: 'Taxi',          emoji: '🚕', category: 'vehicle', color: '#eab308' },
]

export const CATEGORIES = [
  { id: 'ground',   label: 'Sol',        emoji: '🌍' },
  { id: 'road',     label: 'Routes',     emoji: '🛣️' },
  { id: 'nature',   label: 'Nature',     emoji: '🌳' },
  { id: 'building', label: 'Bâtiments',  emoji: '🏠' },
  { id: 'deco',     label: 'Déco',       emoji: '✨' },
  { id: 'vehicle',  label: 'Véhicules',  emoji: '🚗' },
] as const

export const ROAD_TYPES = new Set<ItemType>(['road_straight', 'road_corner', 'road_t', 'road_cross'])
export const VEHICLE_TYPES = new Set<ItemType>(['car_red', 'car_blue', 'car_yellow'])
export const FLAT_TYPES = new Set<ItemType>(['grass', 'dirt', 'sand', 'water', 'snow', 'road_straight', 'road_corner', 'road_t', 'road_cross', 'sidewalk', 'floor_wood', 'floor_tile'])
