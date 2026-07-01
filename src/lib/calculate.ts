// src/lib/calculate.ts
// Полный расчёт электроустановки: объединяет breakers + rcd + panel

import type {
  CalculationInput, CalculationResult, CircuitBreaker, RCD,
  LoadBreakSwitch, PhaseId, ExtendedRating
} from '@/types/electrical'
import { calcMainBreaker, calcRoomBreakers } from '@/lib/calculations/breakers'
import { generateRCDStrategy } from '@/lib/calculations/rcd'
import { calculatePanel } from '@/lib/calculations/panel'
import { selectBreakerModules } from '@/lib/calculations/panel'

/**
 * Подбирает выключатель нагрузки (рубильник/разъединитель) перед вводным автоматом.
 * 
 * 1-фазные сети: 2P рубильник (L+N)
 * 3-фазные сети: 4P рубильник (L1+L2+L3+N)
 * 
 * Автоматическая логика: если вводной >25А или пользователь явно запросил — ставим.
 */
function selectLoadBreakSwitch(
  phases: 1 | 3,
  meterAmps: number,
  useMasterSwitch?: boolean,
  masterSwitchGroups?: string[]
): LoadBreakSwitch | undefined {
  // Ставим только если >25А ИЛИ пользователь явно выбрал
  if (meterAmps <= 25 && !useMasterSwitch) return undefined

  const poles = phases === 3 ? 4 : 2
  const modules = selectBreakerModules(poles)
  const phaseIds: Record<1 | 3, PhaseId> = { 1: 'L1,N', 3: 'L1,L2,L3,N' }

  const groupName = masterSwitchGroups && masterSwitchGroups.length > 0
    ? `Рубильник (управляет: ${masterSwitchGroups.join(', ')})`
    : 'Мастер-выключатель (весь щит)'

  return {
    id: 'load_break',
    type: 'load_break_switch',
    rating: meterAmps as ExtendedRating,
    poles,
    modules,
    group: groupName,
    reason: `${meterAmps}А / ${poles}P — выключатель нагрузки для безопасного ` +
            `отключения щита при обслуживании. Ставится до счётчика/вводного автомата.`,
    phase: phaseIds[phases],
  }
}

/**
 * Распределяет однофазные автоматы по фазам L1/L2/L3 для равномерной нагрузки.
 * 3-полюсные автоматы берут все три фазы.
 * 1-полюсные автоматы равномерно распределяются: L1 → L2 → L3 → L1 → ...
 * 2-полюсные (1P+N) автоматы распределяются как однофазные.
 */
function assignPhases(
  mainBreaker: CircuitBreaker,
  devices: (CircuitBreaker | RCD)[]
): { deviceId: string; phase: PhaseId }[] {
  const assignment: { deviceId: string; phase: PhaseId }[] = []
  let phaseIndex = 0
  const phases: PhaseId[] = ['L1', 'L2', 'L3']

  // Вводной автомат: всегда все фазы
  assignment.push({ deviceId: mainBreaker.id, phase: mainBreaker.poles === 3 ? 'L1,L2,L3' : 'L1,N' })

  for (const d of devices) {
    if (d.poles === 3 || d.poles === 4) {
      assignment.push({ deviceId: d.id, phase: 'L1,L2,L3' })
    } else if (d.type === 'rcd' && d.poles === 2) {
      // УЗО на две фазы
      assignment.push({ deviceId: d.id, phase: 'L1,N' })
    } else {
      // 1-полюсный: чередуем фазы
      const phase = phases[phaseIndex % 3]
      phaseIndex++
      assignment.push({ deviceId: d.id, phase: d.poles === 1 ? phase as PhaseId : `${phase},N` as PhaseId })
    }
  }

  return assignment
}

export function calculateAll(input: CalculationInput): CalculationResult {
  const warnings: string[] = []
  const notes: string[] = []

  // 1. Выключатель нагрузки (рубильник) — перед вводным
  const loadBreakSwitch = selectLoadBreakSwitch(input.supplyPhases, input.meterAmps, input.useMasterSwitch, input.masterSwitchGroups)
  if (loadBreakSwitch) {
    notes.push(`Мастер-выключатель ${loadBreakSwitch.rating}А/${loadBreakSwitch.poles}P — для безопасного отключения щита.`)
  }

  // 2. Вводной автомат
  const mainBreaker = calcMainBreaker(input)

  // 3. Групповые автоматы по комнатам
  const allBreakers: CircuitBreaker[] = input.rooms.flatMap(room => calcRoomBreakers(room))

  // 4. Собираем оборудование щитка без автомата (реле напряжения, DIN-розетка и т.п.)
  const panelEquipment = input.rooms.flatMap(room =>
    room.loads
      .filter(l => !l.hasSeparateGroup && l.modules > 0)
      .map(l => ({ id: l.id, name: l.name, modules: l.modules }))
  )
  const extraModules = panelEquipment.reduce((sum, eq) => sum + eq.modules, 0)

  // 5. Стратегия УЗО
  const rcdResult = generateRCDStrategy(input.rooms, allBreakers, input.bathroomStrategy ?? 'economy')
  const rcdDevices = rcdResult.devices

  // 6. Исключаем автоматы, уже защищённые дифавтоматами
  // Дифавтомат = УЗО + автомат в одном корпусе — отдельный автомат после него не нужен
  let standaloneBreakers: CircuitBreaker[]
  if (input.bathroomStrategy === 'everything_separated') {
    // Стратегия «Всё раздельно»: diff ID = diff_${breaker.id} → точное совпадение
    const diffBreakerIds = new Set<string>()
    for (const d of rcdDevices) {
      if (d.type === 'diff_breaker') {
        diffBreakerIds.add(d.id.replace(/^diff_/, ''))
      }
    }
    standaloneBreakers = allBreakers.filter(b => !diffBreakerIds.has(b.id))
  } else {
    // Старые стратегии: префиксное совпадение по комнате
    const diffRoomIds = new Set<string>()
    for (const d of rcdDevices) {
      if (d.type === 'diff_breaker') {
        const m = d.id.match(/^diff_(.+?)(?:_(?:power|light|floor))?$/)
        if (m) diffRoomIds.add(m[1])
      }
    }
    standaloneBreakers = allBreakers.filter(b =>
      !Array.from(diffRoomIds).some(roomId => b.id.startsWith(roomId + '_'))
    )
  }

  // 7. Расчёт щитка (с учётом breakerless оборудования)
  const panelResult = calculatePanel(mainBreaker, standaloneBreakers, rcdDevices, extraModules)

  // 8. Фазное распределение (для 3-фазных сетей)
  const allDevicesForPhasing: (CircuitBreaker | RCD)[] = [...rcdDevices, ...standaloneBreakers]
  const phaseAssignment = input.supplyPhases === 3
    ? assignPhases(mainBreaker, allDevicesForPhasing)
    : undefined

  // Применяем фазы к самим устройствам
  if (phaseAssignment) {
    const phaseMap = new Map(phaseAssignment.map(a => [a.deviceId, a.phase]))
    allDevicesForPhasing.forEach(d => { d.phase = phaseMap.get(d.id) })
    mainBreaker.phase = phaseMap.get(mainBreaker.id)
  }

  // 9. Валидация и предупреждения
  if (input.rooms.length === 0) {
    warnings.push('Добавьте хотя бы одно помещение для расчёта.')
  }

  if (panelEquipment.length > 0) {
    notes.push(`Оборудование щитка: ${panelEquipment.map(e => `${e.name} (${e.modules} м.)`).join(', ')} — учтено в модулях щита.`)
  }

  const totalLoadAmps = standaloneBreakers.reduce((s, b) => s + b.rating, 0)
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
  const allDevices: (CircuitBreaker | RCD)[] = [mainBreaker, ...rcdDevices, ...standaloneBreakers]

  return {
    mainBreaker,
    loadBreakSwitch,
    devices: allDevices,
    supplyPhases: input.supplyPhases,
    phaseAssignment,
    totalModules: panelResult.totalModules,
    recommendedPanelModules: panelResult.withReserve,
    panelRows: panelResult.rows,
    panelEquipment,
    warnings,
    notes: [...panelResult.notes, rcdResult.explanation, ...notes],
  }
}
