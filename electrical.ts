// src/types/electrical.ts
// Доменные типы электрической системы

export type BreakerCharacteristic = 'B' | 'C' | 'D'
export type BreakerType = 'circuit_breaker' | 'rcd' | 'diff_breaker' | 'main_breaker'
export type RCDCurrentRating = 10 | 25 | 40 | 63  // А
export type RCDLeakageCurrent = 10 | 30 | 100 | 300 // мА
export type BreakerRating = 6 | 10 | 16 | 20 | 25 | 32 | 40 | 50 | 63 // А

export type GroundingSystem = 'TN-C' | 'TN-S' | 'TN-C-S' | 'TT'
export type InstallationType = 'apartment' | 'house'
export type RoomType = 
  | 'living' | 'bedroom' | 'kitchen' | 'bathroom' 
  | 'toilet' | 'hallway' | 'balcony' | 'garage' | 'custom'

export interface CircuitBreaker {
  id: string
  type: BreakerType
  rating: BreakerRating
  characteristic: BreakerCharacteristic
  poles: 1 | 2 | 3 | 4
  modules: number // ширина в модулях (1 модуль = 17.5мм)
  group: string   // название группы ("Розетки кухня")
  reason: string  // обоснование выбора
}

export interface RCD {
  id: string
  type: 'rcd' | 'diff_breaker'
  ratingAmps: RCDCurrentRating
  leakageMA: RCDLeakageCurrent
  poles: 2 | 4
  modules: number
  protectedGroups: string[] // id групп под защитой
  reason: string
}

export interface ElectricalLoad {
  id: string
  name: string
  powerW: number      // мощность, Вт
  currentA: number    // ток, А
  isHighLoad: boolean // варочная, духовка, стиралка...
  hasSeparateGroup: boolean // отдельная группа обязательна
}

export interface RoomConfig {
  id: string
  type: RoomType
  name: string
  socketGroups: number    // кол-во розеточных групп
  lightingPoints: number  // точки освещения
  loads: ElectricalLoad[] // спецнагрузки
  requiresRCD: boolean    // ванная, детская → обязательно УЗО 10мА
}

export interface CalculationInput {
  installationType: InstallationType
  totalAreaM2: number
  floors: number
  grounding: GroundingSystem
  supplyPhases: 1 | 3
  meterAmps: 25 | 32 | 40 | 50 | 63 // разрешённая мощность от сети
  rooms: RoomConfig[]
}

export interface CalculationResult {
  mainBreaker: CircuitBreaker
  inputRCD?: RCD            // вводное УЗО (если TN-C)
  devices: (CircuitBreaker | RCD)[]
  totalModules: number
  recommendedPanelModules: number // с запасом 20%
  panelRows: number
  warnings: string[]
  notes: string[]
}

// Типы для схем
export type SchemeType = 
  | 'light_box' 
  | 'socket_box' 
  | 'passthrough_switch' 
  | 'cross_switch'
  | 'panel_diagram'

export interface SchemeMetadata {
  slug: string
  type: SchemeType
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  wiresCount: number
  tags: string[]
}

// Цвета проводников по ПУЭ / ГОСТ
export const WIRE_COLORS = {
  L:   '#c0392b', // фаза — красный/коричневый
  N:   '#2980b9', // ноль — синий
  PE:  '#27ae60', // земля — жёлто-зелёный  
  SW:  '#8e44ad', // управляющий (выключатель) — фиолетовый
  COM: '#e67e22', // общий (проходной) — оранжевый
  L1:  '#e74c3c', // переключатель поз.1
  L2:  '#e74c3c', // переключатель поз.2
} as const
