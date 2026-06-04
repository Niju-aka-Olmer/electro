// src/lib/calculate.ts
// Полный расчёт электроустановки: объединяет breakers + rcd + panel

import type { CalculationInput, CalculationResult, CircuitBreaker, RCD } from '@/types/electrical'
import { calcMainBreaker, calcRoomBreakers } from '@/lib/calculations/breakers'
import { generateRCDStrategy } from '@/lib/calculations/rcd'
import { calculatePanel } from '@/lib/calculations/panel'

export function calculateAll(input: CalculationInput): CalculationResult {
  const warnings: string[] = []
  const notes: string[] = []

  // 1. Вводной автомат
  const mainBreaker = calcMainBreaker(input)

  // 2. Групповые автоматы по комнатам
  const allBreakers: CircuitBreaker[] = input.rooms.flatMap(room => calcRoomBreakers(room))

  // 3. Стратегия УЗО
  const rcdResult = generateRCDStrategy(input.rooms, allBreakers, input.bathroomStrategy ?? 'economy')
  const rcdDevices = rcdResult.devices

  // 4. Расчёт щитка
  const panelResult = calculatePanel(mainBreaker, allBreakers, rcdDevices)

  // 5. Валидация и предупреждения
  if (input.rooms.length === 0) {
    warnings.push('Добавьте хотя бы одно помещение для расчёта.')
  }

  const totalLoadAmps = allBreakers.reduce((s, b) => s + b.rating, 0)
  if (totalLoadAmps > input.meterAmps * 1.5) {
    warnings.push(
      `Сумма номиналов автоматов (${totalLoadAmps}А) больше вводного (${input.meterAmps}А) — это НОРМАЛЬНО. ` +
      `Автоматы рассчитаны на максимальный ток каждой группы, но все группы редко работают ` +
      `одновременно на полную мощность (например, свет + розетки + стиралка + варочная + ` +
      `кондиционер + чайник — маловероятно, что всё включено разом). ` +
      `Вводной автомат отключится, ТОЛЬКО если реальный общий ток превысит ${input.meterAmps}А. ` +
      `Это называется селективность — нормальная практика проектирования.`
    )
  }

  if (input.rooms.some(r => r.type === 'bathroom' || r.type === 'toilet')) {
    notes.push('Для ванной/туалета — УЗО 10мА обязательно (ПУЭ 7.1.83).')
  }

  // Всё собираем в результат
  const allDevices: (CircuitBreaker | RCD)[] = [mainBreaker, ...rcdDevices, ...allBreakers]

  return {
    mainBreaker,
    devices: allDevices,
    totalModules: panelResult.totalModules,
    recommendedPanelModules: panelResult.withReserve,
    panelRows: panelResult.rows,
    warnings,
    notes: [...panelResult.notes, rcdResult.explanation, ...notes],
  }
}
