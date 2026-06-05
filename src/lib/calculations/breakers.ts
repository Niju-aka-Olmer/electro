// src/lib/calculations/breakers.ts
// Логика выбора автоматических выключателей по ПУЭ-7

import type {
  BreakerRating, CircuitBreaker, RoomConfig,
  CalculationInput, ElectricalLoad
} from '@/types/electrical'

// Стандартный ряд номиналов автоматов (А)
export const BREAKER_RATINGS: BreakerRating[] = [6, 10, 16, 20, 25, 32, 40, 50, 63]

// Напряжение сети
const VOLTAGE = 220 // В

// Коэффициент мощности для бытовых нагрузок
const POWER_FACTOR = 0.95

/**
 * Выбор ближайшего бо́льшего номинала автомата
 * ПУЭ 3.1.8: Iн.авт ≥ Iрасч
 */
export function selectBreakerRating(loadAmps: number): BreakerRating {
  const rating = BREAKER_RATINGS.find(r => r >= loadAmps * 1.25)
  return rating ?? 63 // если превышает — 63А (максимум для жилья)
}

/**
 * Расчёт тока нагрузки по мощности
 */
export function powerToAmps(powerW: number): number {
  return powerW / (VOLTAGE * POWER_FACTOR)
}

/**
 * Ширина автомата в модулях
 */
function getBreakerModules(poles: 1 | 2 | 3 | 4): number {
  return poles // 1P = 1 модуль, 2P = 2 модуля
}

/**
 * Расчёт вводного автомата
 * Выбирается по разрешённой мощности от счётчика
 */
export function calcMainBreaker(input: CalculationInput): CircuitBreaker {
  const is3Phase = input.supplyPhases === 3
  return {
    id: 'main',
    type: 'main_breaker',
    rating: input.meterAmps,
    characteristic: 'C',
    poles: is3Phase ? 3 : 2,   // 3 фазы → 3P, 1 фаза → 2P (L+N)
    modules: is3Phase ? 3 : 2,
    group: 'Вводной',
    reason: `Номинал ${input.meterAmps}А, ${is3Phase ? '3-полюсный (L1+L2+L3)' : '2-полюсный (L+N)'}. `
      + `${is3Phase ? 'Трёхфазный ввод' : 'Однофазный ввод'} 220В. `
      + `Характеристика C — для смешанных нагрузок (ПУЭ 3.1.8).`
  }
}

/**
 * Расчёт групповых автоматов для комнаты
 */
export function calcRoomBreakers(room: RoomConfig): CircuitBreaker[] {
  const breakers: CircuitBreaker[] = []

  // --- Розеточные группы ---
  // Стандарт: 16А на розеточную группу (ПУЭ 7.1.68)
  for (let i = 0; i < room.socketGroups; i++) {
    breakers.push({
      id: `${room.id}_socket_${i + 1}`,
      type: 'circuit_breaker',
      rating: 16,
      characteristic: 'C',
      poles: 1,
      modules: 1,
      group: `Розетки: ${room.name}${room.socketGroups > 1 ? ` (гр.${i + 1})` : ''}`,
      reason: `16А на розеточную группу — стандарт для бытовых потребителей (ПУЭ 7.1.68).`
    })
  }

  // --- Освещение ---
  // Стандарт: 10А на освещение (ПУЭ 7.1.68)
  if (room.lightingPoints > 0) {
    breakers.push({
      id: `${room.id}_light`,
      type: 'circuit_breaker',
      rating: 10,
      characteristic: 'B',
      poles: 1,
      modules: 1,
      group: `Освещение: ${room.name}`,
      reason: `10А на освещение, характеристика B — для чисто активных нагрузок (ПУЭ 7.1.68).`
    })
  }

  // --- Спецнагрузки (отдельная группа на каждую) ---
  for (const load of room.loads) {
    if (load.hasSeparateGroup) {
      const loadAmps = powerToAmps(load.powerW)
      const rating = selectBreakerRating(loadAmps)
      breakers.push({
        id: `${room.id}_load_${load.id}`,
        type: 'circuit_breaker',
        rating,
        characteristic: 'C',
        poles: load.powerW > 4000 ? 2 : 1, // >4кВт → 2P
        modules: load.powerW > 4000 ? 2 : 1,
        group: `${load.name}: ${room.name}`,
        reason: `${load.powerW}Вт / ${VOLTAGE}В = ${loadAmps.toFixed(1)}А, `
          + `выбран ${rating}А с запасом. `
          + (load.powerW > 4000 ? '2P — мощная нагрузка >4кВт. ' : '')
          + `Отдельная группа обязательна для ${load.name} (ПУЭ 7.1.70).`
      })
    }
  }

  return breakers
}

/**
 * Специальные нагрузки с фиксированными номиналами
 */
export const STANDARD_LOADS: Record<string, { powerW: number; ratingA: BreakerRating; poles: 1 | 2; note: string }> = {
  cooktop:      { powerW: 7000, ratingA: 32, poles: 2, note: 'Варочная поверхность' },
  oven:         { powerW: 3500, ratingA: 16, poles: 1, note: 'Духовой шкаф' },
  washer:       { powerW: 2500, ratingA: 16, poles: 1, note: 'Стиральная машина' },
  dishwasher:   { powerW: 2200, ratingA: 16, poles: 1, note: 'Посудомоечная машина' },
  ac:           { powerW: 2500, ratingA: 16, poles: 1, note: 'Кондиционер' },
  boiler:       { powerW: 2000, ratingA: 16, poles: 1, note: 'Водонагреватель' },
  electric_floor: { powerW: 1000, ratingA: 10, poles: 1, note: 'Тёплый пол' },
  sauna:        { powerW: 6000, ratingA: 25, poles: 2, note: 'Электросауна' },
}
