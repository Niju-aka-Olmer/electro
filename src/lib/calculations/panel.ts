// src/lib/calculations/panel.ts
// Расчёт электрического щитка: модули, размер, рекомендации

import type { CircuitBreaker, RCD } from '@/types/electrical'

export interface PanelCalculation {
  totalModules: number
  withReserve: number    // +20% запас, округлить до ближайшего ряда
  rows: number           // количество DIN-реек
  panelType: 'small' | 'medium' | 'large'
  panelDescription: string
  modelsExamples: string[]
  notes: string[]
}

// Стандартные размеры щитков (количество модулей на ряд)
const PANEL_SIZES = [12, 24, 36, 48, 60, 72] as const

// Модули на одну DIN-рейку (стандарт 35мм/рейка)
const MODULES_PER_ROW = 12 // для компактных щитков

/**
 * Подсчёт модулей в устройстве
 */
function getDeviceModules(device: CircuitBreaker | RCD): number {
  return device.modules
}

/**
 * Полный расчёт щитка
 */
export function calculatePanel(
  mainBreaker: CircuitBreaker,
  groupBreakers: CircuitBreaker[],
  rcdDevices: RCD[]
): PanelCalculation {
  // Сумма всех модулей
  const mainModules = getDeviceModules(mainBreaker)
  const groupModules = groupBreakers.reduce((sum, b) => sum + getDeviceModules(b), 0)
  const rcdModules = rcdDevices.reduce((sum, r) => sum + getDeviceModules(r), 0)
  
  // Нулевые шины: 1 модуль на каждые 12 групп
  const neutralBusModules = Math.ceil(groupBreakers.length / 12)
  
  // PE шина: обычно не на DIN-рейке, но считаем место
  const peModules = 0
  
  const totalModules = mainModules + groupModules + rcdModules + neutralBusModules

  // Запас 20%, округлить вверх до кратного 12
  const withReserveExact = totalModules * 1.2
  const withReserve = Math.ceil(withReserveExact / 12) * 12

  const rows = Math.ceil(withReserve / 12)

  // Определение типа щитка
  let panelType: PanelCalculation['panelType']
  let panelDescription: string
  let modelsExamples: string[]

  if (withReserve <= 12) {
    panelType = 'small'
    panelDescription = `Малый щиток на 1 рейку (${withReserve} мест)`
    modelsExamples = [
      'IEK ЩРВ-П-12 (12 мест, встроенный)',
      'ABB Mistral 41N 12 модулей',
      'Legrand Practibox 13 мест'
    ]
  } else if (withReserve <= 36) {
    panelType = 'medium'
    panelDescription = `Средний щиток на ${rows} рейки (${withReserve} мест)`
    modelsExamples = [
      `IEK ЩРВ-П-${withReserve} (встроенный)`,
      `ABB Mistral 41N ${withReserve} модулей`,
      `TDM ЩРН-П-${withReserve} (наружный)`
    ]
  } else {
    panelType = 'large'
    panelDescription = `Большой щиток на ${rows} рейки (${withReserve} мест)`
    modelsExamples = [
      `IEK ЩРВ-П-${withReserve} (встроенный, металл)`,
      `ABB AT/U ${withReserve}M`,
      `Schneider Pragma ${withReserve} модулей`
    ]
  }

  const notes: string[] = [
    `Итого устройств: ${totalModules} модулей`,
    `С запасом 20%: ${withReserve} мест`,
    `DIN-рейки: ${rows} шт. (по 12 модулей каждая)`,
    `Нулевая шина: ${neutralBusModules} место(а) на рейке`,
    `PE шина — устанавливается отдельно на корпус щита`,
  ]

  if (rows > 3) {
    notes.push(`⚠️ Большой щит — рекомендуется встроенный вариант (AP) для скрытой установки`)
  }

  return {
    totalModules,
    withReserve,
    rows,
    panelType,
    panelDescription,
    modelsExamples,
    notes
  }
}

/**
 * Порядок размещения устройств на DIN-рейке (сверху вниз)
 * Рекомендуемая группировка для удобства обслуживания
 */
export function getPanelLayout(
  mainBreaker: CircuitBreaker,
  rcdDevices: RCD[],
  groupBreakers: CircuitBreaker[]
): { label: string; device: CircuitBreaker | RCD; rail: number; position: number }[] {
  const layout: { label: string; device: CircuitBreaker | RCD; rail: number; position: number }[] = []
  let rail = 1
  let position = 1

  const addDevice = (device: CircuitBreaker | RCD, label: string) => {
    if (position + device.modules > 13) {
      rail++
      position = 1
    }
    layout.push({ label, device, rail, position })
    position += device.modules
  }

  // 1. Вводной автомат
  addDevice(mainBreaker, 'Вводной QB1')

  // 2. УЗО/дифы
  rcdDevices.forEach((rcd, i) => {
    addDevice(rcd, rcd.type === 'rcd' ? `УЗО F${i + 1}` : `ДИФ F${i + 1}`)
  })

  // 3. Групповые автоматы
  groupBreakers.forEach((b, i) => {
    addDevice(b, `QF${i + 1}`)
  })

  return layout
}
