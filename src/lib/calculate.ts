// src/lib/calculate.ts
// Полный расчёт электроустановки: объединяет breakers + rcd + panel

import type {
  CalculationInput, CalculationResult, CircuitBreaker, RCD,
  LoadBreakSwitch, PhaseId, ExtendedRating, RoomConfig
} from '@/types/electrical'
import { calcMainBreaker, calcRoomBreakers } from '@/lib/calculations/breakers'
import { generateRCDStrategy } from '@/lib/calculations/rcd'
import { calculatePanel } from '@/lib/calculations/panel'
import { selectBreakerModules } from '@/lib/calculations/panel'

/**
 * Проверяет, является ли устройство УЗО или дифавтоматом
 */
function isRCD(d: CircuitBreaker | RCD): d is RCD {
  return d.type === 'rcd' || d.type === 'diff_breaker'
}

/**
 * Генерирует краткое (500-800 слов) пояснение на понятном обывателю языке:
 * почему выбраны именно такие автоматы, УЗО и дифавтоматы.
 */
function generateExplanation(
  input: CalculationInput,
  mainBreaker: CircuitBreaker,
  allDevices: (CircuitBreaker | RCD)[],
  loadBreakSwitch: LoadBreakSwitch | undefined,
  panelEquipment: { id: string; name: string; modules: number }[]
): string {
  const lines: string[] = []
  const rooms = input.rooms

  const rcds = allDevices.filter(isRCD).filter(d => d.type === 'rcd')
  const diffs = allDevices.filter(isRCD).filter(d => d.type === 'diff_breaker')
  const breakers = allDevices.filter((d): d is CircuitBreaker => !isRCD(d) && d.id !== mainBreaker.id)

  const hasWet = rooms.some(r => r.type === 'bathroom' || r.type === 'toilet')
  const strategy = input.bathroomStrategy ?? 'economy'

  // ── 1. Что сделано ──
  lines.push(`## Что получилось\n`)
  const totalAllMods = allDevices.reduce((s, d) => s + d.modules, 0)
  lines.push(`Для вашего ${input.installationType === 'house' ? 'дома' : 'квартиры'} `
    + `(${rooms.map(r => r.name).join(', ')}) мы подобрали электрощит `
    + `на ${totalAllMods} модулей — это примерно `
    + `${Math.ceil(totalAllMods * 1.2 / 12) * 12} модулей с запасом. `
    + `В щите будет ${allDevices.length} устройств: вводной автомат, `
    + `${rcds.length + diffs.length} защитных устройств от утечки тока (УЗО/дифавтоматы) `
    + `и ${breakers.length} групповых автоматов.`)

  // ── 2. Вводной автомат ──
  const is3Phase = input.supplyPhases === 3
  lines.push(`\n## Вводной автомат — ${mainBreaker.rating}А (${mainBreaker.poles}P, характеристика ${mainBreaker.characteristic})\n`)
  lines.push(`Это главный рубильник всей квартиры. Его номинал (${mainBreaker.rating}А) `
    + `определён не нами, а сетевой компанией — именно столько написано на вашем счётчике. `
    + `Если вы включите больше приборов одновременно, чем позволяет этот ток, `
    + `сработает вводной автомат и обесточит всю квартиру. `
    + `Характеристика C — стандарт для жилых помещений: выдерживает кратковременные `
    + `пусковые токи (например, когда включается холодильник или стиральная машина).`)

  if (is3Phase) {
    lines.push(`У вас трёхфазный ввод (380В), поэтому вводной автомат 3-полюсный — `
      + `защищает все три фазы одновременно.`)
  }

  if (loadBreakSwitch) {
    lines.push(`Перед вводным автоматом стоит рубильник (выключатель нагрузки) `
      + `${loadBreakSwitch.rating}А — он нужен, чтобы электрик мог полностью обесточить `
      + `щит при ремонте или замене оборудования.`)
  }

  // ── 3. Защита от утечки тока ──
  lines.push(`\n## Защита от поражения током (УЗО и дифавтоматы)\n`)
  lines.push(`Это самая важная часть щита. Обычный автомат защищает только от короткого `
    + `замыкания и перегрузки — он отключается, когда ток слишком большой. `
    + `Но он НЕ спасёт, если человека ударит током (например, вы коснулись `
    + `неисправной стиральной машины). Для этого нужно УЗО или дифавтомат — `
    + `прибор, который чувствует утечку тока и отключается за доли секунды.`)

  if (hasWet) {
    lines.push(`\nУ вас есть влажные помещения — для них обязательно УЗО 10 миллиампер (10мА). `
      + `Почему 10, а не 30? Потому что во влажной среде (ванная, туалет) `
      + `сопротивление кожи резко падает, и даже небольшой ток может быть смертельным. `
      + `10мА — это максимально безопасный порог.`)
  }

  // ── 4. Описание стратегии ──
  lines.push(`\n## Схема защиты: ${strategy === 'economy' ? 'эконом' : strategy === 'separate' ? 'раздельная' : 'максимальная'}\n`)

  if (strategy === 'economy') {
    lines.push(`Вы выбрали эконом-вариант: одно УЗО на всё влажное помещение (и розетки, `
      + `и свет защищены одним дифавтоматом). Это дёшево, но при утечке `
      + `отключится всё помещение — в том числе свет. Зато меньше устройств в щите.`)
  } else if (strategy === 'separate') {
    lines.push(`Вы выбрали раздельную защиту: розетки и свет во влажных помещениях `
      + `защищены разными дифавтоматами. Если сработает защита розеток — `
      + `свет останется гореть, вы не останетесь в темноте. `)
    const waterDiffs = diffs.filter(d =>
      d.id.includes('washer') || d.id.includes('dishwasher') ||
      d.id.includes('boiler') || d.id.includes('water_heater'))
    if (waterDiffs.length > 0) {
      lines.push(`Кроме того, приборы, связанные с водой (стиральная, посудомоечная машина, `
        + `водонагреватель) вынесены на отдельные дифавтоматы 10мА. Это самое `
        + `безопасное решение: если, например, пробьёт стиральную машину — `
        + `отключится только она, а не вся кухня или ванная.`)
    }
  } else {
    lines.push(`Вы выбрали максимальную защиту: КАЖДАЯ линия (и розетки, и свет, `
      + `и каждый мощный прибор) на собственном дифавтомате. Это лучший вариант `
      + `по безопасности: любая неисправность отключит только одну линию, `
      + `всё остальное продолжит работать. Минус — больше устройств в щите, `
      + `значит, нужен щит побольше.`)
  }

  // ── 5. Приборы с водой ──
  const WATER_IDS = ['washer', 'dishwasher', 'boiler', 'water_heater']
  const waterLoads = rooms.flatMap(r =>
    r.loads.filter(l => WATER_IDS.includes(l.id)))
  if (waterLoads.length > 0) {
    lines.push(`\n## Приборы, связанные с водой\n`)
    const names: Record<string, string> = {
      washer: 'Стиральная машина',
      dishwasher: 'Посудомоечная машина',
      boiler: 'Водонагреватель',
      water_heater: 'Бойлер',
    }
    for (const load of waterLoads) {
      const room = rooms.find(r => r.loads.some(l => l.id === load.id))
      const label = names[load.id] || load.name
      lines.push(`**${label}**${room ? ` (${room.name})` : ''}. `
        + `Любой прибор, контактирующий с водой — зона повышенной опасности. `
        + `При повреждении изоляции вода может оказаться под напряжением, `
        + `а человек, прикоснувшийся к корпусу — под ударом. Поэтому такие приборы `
        + `защищены УЗО 10мА (самый чувствительный порог). `
        + `Это требование ПУЭ, и оно спасло тысячи жизней.`)
    }
  }

  // ── 6. Тёплый пол ──
  const floorLoads = rooms.flatMap(r =>
    r.loads.filter(l => l.id === 'electric_floor'))
  if (floorLoads.length > 0) {
    lines.push(`\n**Тёплый пол**. Нагревательный кабель или мат, уложенный в стяжку — `
      + `это скрытая проводка, которую нельзя осмотреть. При повреждении `
      + `(например, сверление пола) ток может уйти в землю. Тёплый пол всегда `
      + `защищается отдельным дифавтоматом ${hasWet ? '10мА' : '30мА'}, `
      + `чтобы не оставить без защиты другие линии.`)
  }

  // ── 7. Групповые автоматы ──
  lines.push(`\n## Групповые автоматы\n`)
  lines.push(`Обычные автоматы (без УЗО) защищают проводку в каждой комнате. `
    + `Розеточные группы — всегда 16А (стандартный бытовой максимум, `
    + `рассчитан на провод сечением 2,5 мм²). Освещение — 10А (провод 1,5 мм², `
    + `характеристика B — для ровной нагрузки без пусковых токов).`)

  const heavyLoads = rooms.flatMap(r =>
    r.loads.filter(l => l.hasSeparateGroup && l.powerW >= 5000))
  if (heavyLoads.length > 0) {
    lines.push(`Мощные приборы (${heavyLoads.map(l => l.name).join(', ')}) `
      + `сидят на отдельных автоматах с запасом 25% по току — `
      + `чтобы автомат не срабатывал ложно при включении.`)
  }

  // ── 8. Итог ──
  const totalBreakerModules = breakers.reduce((s, b) => s + b.modules, 0)
  const totalRCDModules = [...rcds, ...diffs].reduce((s, d) => s + d.modules, 0)
  const extraMods = panelEquipment.reduce((s, e) => s + e.modules, 0)
  const allMods = totalBreakerModules + totalRCDModules + mainBreaker.modules + (loadBreakSwitch?.modules ?? 0) + extraMods

  lines.push(`\n## Что в итоге\n`)
  lines.push(`Ваш щит займёт ${allMods} модулей DIN-рейки. `
    + `Рекомендуем взять щит на ${Math.ceil(allMods * 1.2 / 12) * 12} модулей — `
    + `с запасом 20% на будущее (вдруг добавите кондиционер или ещё одну линию). `
    + `Все устройства подобраны по ПУЭ-7 — это действующие российские правила `
    + `устройства электроустановок. Такой щит обеспечит вашу безопасность `
    + `и пройдёт любую проверку.`)

  const totalStandaloneAmps = breakers.reduce((s, b) => s + b.rating, 0)
  if (totalStandaloneAmps > input.meterAmps * 1.5) {
    lines.push(`\n*Важно:* сумма номиналов всех автоматов может быть больше `
      + `вводного — это нормально. В реальной жизни все приборы не работают `
      + `одновременно на полную мощность, а автоматы подбираются с запасом.`)
  }

  return lines.join('\n')
}

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
  if (input.bathroomStrategy === 'everything_separated' || input.bathroomStrategy === 'separate') {
    // Стратегия «Всё раздельно» или «Раздельный»: diff ID = diff_${breaker.id} → точное совпадение
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

  // Генерируем пояснение на понятном языке
  const explanation = generateExplanation(input, mainBreaker, allDevices, loadBreakSwitch, panelEquipment)

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
    explanation,
  }
}
