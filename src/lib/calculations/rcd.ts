// src/lib/calculations/rcd.ts
// Логика выбора УЗО и дифавтоматов по ПУЭ-7 / ГОСТ Р 50571

import type { CircuitBreaker, RCD, RoomConfig, RoomType } from '@/types/electrical'

/**
 * Комнаты, требующие УЗО 10мА (повышенная опасность)
 * ПУЭ 7.1.83: ванные, душевые — обязательно 10мА
 */
const HIGH_RISK_ROOMS: RoomType[] = ['bathroom', 'toilet']

/**
 * Комнаты, где рекомендуется дифавтомат вместо УЗО+автомат
 * (компактность + защита)
 */
const DIFF_RECOMMENDED_ROOMS: RoomType[] = ['bathroom', 'toilet', 'kitchen']

/**
 * Определить, нужен ли дифавтомат вместо связки УЗО+автомат
 * Правило: ванная, туалет → диф 16А/10мА (компактно, надёжно)
 */
export function shouldUseDiffBreaker(room: RoomConfig): boolean {
  return DIFF_RECOMMENDED_ROOMS.includes(room.type)
}

/**
 * Требуемый ток утечки УЗО для комнаты
 * ПУЭ 7.1.83: влажные помещения → 10мА
 * Общие помещения → 30мА
 */
export function getRequiredLeakage(room: RoomConfig): 10 | 30 {
  return HIGH_RISK_ROOMS.includes(room.type) ? 10 : 30
}

/**
 * Выбор тока УЗО: должен быть ≥ суммарного тока защищаемых автоматов
 * Стандартный ряд УЗО: 10, 25, 40, 63А
 */
export function selectRCDRating(groupBreakers: CircuitBreaker[]): 10 | 25 | 40 | 63 {
  const totalAmps = groupBreakers.reduce((sum, b) => sum + b.rating, 0)
  if (totalAmps <= 10) return 10
  if (totalAmps <= 25) return 25
  if (totalAmps <= 40) return 40
  return 63
}

/**
 * Создать УЗО для группы автоматов
 */
export function createRCD(
  id: string,
  ratingAmps: 10 | 25 | 40 | 63,
  leakageMA: 10 | 30 | 100 | 300,
  protectedGroups: string[],
  reason: string
): RCD {
  return {
    id,
    type: 'rcd',
    ratingAmps,
    leakageMA,
    poles: 2,
    modules: 2, // УЗО 2P = 2 модуля
    protectedGroups,
    reason
  }
}

/**
 * Создать дифавтомат для одной группы
 */
export function createDiffBreaker(
  id: string,
  ratingAmps: number,
  leakageMA: 10 | 30,
  group: string,
  reason: string
): RCD {
  return {
    id,
    type: 'diff_breaker',
    ratingAmps: ratingAmps as 10 | 25 | 40 | 63,
    leakageMA,
    poles: 2,
    modules: 2, // диф 2P = 2 модуля
    protectedGroups: [group],
    reason
  }
}

/**
 * Стратегия расстановки УЗО для всей квартиры
 *
 * Схема 1: Одно вводное УЗО (30мА) + все автоматы
 * → Дёшево, но при срабатывании отключается всё
 * → Подходит для малых квартир (1-2 комнаты)
 *
 * Схема 2: Несколько групповых УЗО по зонам
 * → Ванная/кухня: 10мА (влага)
 * → Розетки: 30мА
 * → Освещение: часто без УЗО (ПУЭ допускает)
 * → Рекомендуется ПУЭ 7.1.83
 *
 * @param bathroomStrategy - 'economy': один диф на влажное помещение (розетки+свет через него)
 *                          - 'separate': отдельный диф на розетки и отдельный на свет
 *                          - 'everything_separated': индивидуальный диф на КАЖДЫЙ breaker всех помещений
 */
export function generateRCDStrategy(
  rooms: RoomConfig[],
  groupBreakers: CircuitBreaker[],
  bathroomStrategy: 'economy' | 'separate' | 'everything_separated' = 'economy'
): {
  strategy: 'single' | 'grouped'
  devices: RCD[]
  explanation: string
} {
  const totalGroups = groupBreakers.length

  /** Создать устройства для влажной комнаты по выбранной стратегии */
  function makeWetRoomDiffs(room: RoomConfig, skipBreakerIds?: Set<string>): RCD[] {
    let socketBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('socket'))
    let lightBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('light'))
    let loadBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('load'))

    // Исключаем breaker'ы, обрабатываемые отдельно (водозависимые приборы)
    if (skipBreakerIds) {
      socketBreakers = socketBreakers.filter(b => !skipBreakerIds.has(b.id))
      lightBreakers = lightBreakers.filter(b => !skipBreakerIds.has(b.id))
      loadBreakers = loadBreakers.filter(b => !skipBreakerIds.has(b.id))
    }

    // Тёплый пол — всегда отдельный диф (ПУЭ 7.1.84)
    const floorHeatingBreakers = loadBreakers.filter(b => b.id.includes('electric_floor'))
    const otherLoadBreakers = loadBreakers.filter(b => !b.id.includes('electric_floor'))

    const result: RCD[] = []

    // Отдельный дифавтомат на тёплый пол в мокрой зоне
    if (floorHeatingBreakers.length > 0) {
      const floorRating = Math.max(...floorHeatingBreakers.map(b => b.rating), 10)
      result.push(createDiffBreaker(
        `diff_${room.id}_floor`,
        Math.min(floorRating, 16) as 10 | 25 | 40 | 63,
        10,
        `${room.name} (тёплый пол)`,
        `Дифавтомат ${Math.min(floorRating, 16)}А/10мА на тёплый пол в ${room.name}.\n` +
        `ПУЭ 7.1.84: нагревательные кабели/маты во влажных зонах — отдельная линия с УЗО 10мА.\n` +
        `Альтернатива (ГОСТ Р 50571.7.701): при наличии ДСУП (доп. уравнивание потенциалов) ` +
        `и экранированного кабеля — допускается УЗО 30мА, если ток утечки <0.3мА/А нагрузки. ` +
        `Для 6-10А это <3мА, что значительно ниже 10мА — вариант возможен, ` +
        `но ПУЭ 7.1.83-84 предписывает 10мА в мокрых зонах.`
      ))
    }

    if (bathroomStrategy === 'separate') {
      // Вариант Б: отдельные дифавтоматы на розетки/технику и на свет
      if (socketBreakers.length > 0 || otherLoadBreakers.length > 0) {
        const allPowerBreakers = [...socketBreakers, ...otherLoadBreakers]
        const maxRating = Math.max(...allPowerBreakers.map(b => b.rating), 16)
        result.push(createDiffBreaker(
          `diff_${room.id}_power`,
          Math.min(maxRating, 25) as 10 | 25 | 40 | 63,
          10,
          `${room.name} (розетки/техника)`,
          `Дифавтомат ${Math.min(maxRating, 25)}А/10мА на розетки и технику в ${room.name}. ` +
          `Отдельный диф — при срабатывании свет продолжает гореть (ПУЭ 7.1.83).`
        ))
      }

      if (lightBreakers.length > 0) {
        const maxLightRating = Math.max(...lightBreakers.map(b => b.rating), 10)
        result.push(createDiffBreaker(
          `diff_${room.id}_light`,
          Math.min(maxLightRating, 25) as 10 | 25 | 40 | 63,
          30,
          `${room.name} (освещение)`,
          `Дифавтомат ${Math.min(maxLightRating, 25)}А/30мА на освещение в ${room.name}. ` +
          `Освещение — 30мА (Роспотребнадзор). Отдельный диф — при срабатывании розеток свет остаётся включённым.`
        ))
      }

      return result
    }

    // Вариант А (economy): один диф на всё, кроме тёплого пола
    const otherBreakers = [...socketBreakers, ...otherLoadBreakers, ...lightBreakers]
    if (otherBreakers.length > 0) {
      const maxRating = Math.max(...otherBreakers.map(b => b.rating), 16)
      const diffRating = Math.min(maxRating, 25) as 10 | 25 | 40 | 63
      result.push(createDiffBreaker(
        `diff_${room.id}`,
        diffRating,
        10,
        room.name,
        `Дифавтомат ${diffRating}А/10мА в ${room.name} — защищает все линии, кроме тёплого пола. ` +
        `Эконом-вариант: один диф на розетки, свет и технику. ` +
        `При срабатывании всё помещение обесточивается (кроме тёплого пола), ПУЭ 7.1.83.`
      ))
    }

    return result
  }

  /**
   * Создать индивидуальные дифавтоматы для водозависимых приборов
   * (стиральная машина, посудомоечная машина, бойлер/водонагреватель).
   * Используется для стратегии 'separate' — каждый такой прибор на своём дифе.
   */
  function makeWaterRelatedDiffs(): RCD[] {
    // dishwasher ДО washer — иначе 'dishwasher' совпадает с подстрокой 'washer'
    const WATER_RELATED = ['dishwasher', 'washer', 'boiler', 'water_heater']
    const labels: Record<string, string> = {
      dishwasher: 'посудомоечная машина',
      washer: 'стиральная машина',
      boiler: 'водонагреватель',
      water_heater: 'бойлер',
    }

    const result: RCD[] = []
    for (const breaker of groupBreakers) {
      const matchedKey = WATER_RELATED.find(k => breaker.id.includes(k))
      if (!matchedKey) continue

      // Определяем комнату
      const room = rooms.find(r => breaker.id.startsWith(r.id))
      const roomName = room?.name || matchedKey
      const label = labels[matchedKey]

      result.push(createDiffBreaker(
        `diff_${breaker.id}`,
        Math.min(breaker.rating, 25) as 10 | 25 | 40 | 63,
        10,
        `${roomName} (${label})`,
        `Индивидуальный дифавтомат на ${label} в ${roomName}. ` +
        `Прибор связан с водой — УЗО 10мА (ПУЭ 7.1.83).`
      ))
    }
    return result
  }

  /**
   * Создать индивидуальный дифавтомат для КАЖДОГО breaker в комнате.
   * Используется для стратегии 'everything_separated'.
   * 
   * Правила:
   * - Влажные помещения (bathroom, toilet): 10мА для всех линий
   * - Приборы, связанные с водой (washer, dishwasher, boiler, water_heater): 10мА независимо от помещения
   * - Тёплый пол (electric_floor): 10мА в мокрой зоне, 30мА в сухой
   * - Всё остальное: 30мА
   */
  function makeSeparatedDiffs(room: RoomConfig): RCD[] {
    const roomBreakers = groupBreakers.filter(b => b.id.startsWith(room.id))
    const isWetRoom = HIGH_RISK_ROOMS.includes(room.type)

    // dishwasher ДО washer — иначе 'dishwasher' совпадает с подстрокой 'washer'
    const WATER_RELATED = ['dishwasher', 'washer', 'boiler', 'water_heater']

    return roomBreakers.map(breaker => {
      // Определяем ток утечки
      let leakage: 10 | 30 = 30
      const isWaterRelated = WATER_RELATED.some(id => breaker.id.includes(id))

      if (isWetRoom) {
        // Влажное помещение: розетки/приборы/тёплый пол — 10мА, освещение — 30мА (Роспотребнадзор)
        leakage = breaker.id.includes('light') ? 30 : 10
      } else if (isWaterRelated) {
        leakage = 10 // прибор связан с водой — 10мА
      } else if (breaker.id.includes('electric_floor') && isWetRoom) {
        leakage = 10 // тёплый пол в мокрой зоне — 10мА
      }

      // Формируем читаемое имя группы
      let groupName = room.name
      if (breaker.id.includes('socket')) {
        const idx = breaker.id.match(/socket_(\d+)/)?.[1] || '1'
        groupName = `${room.name} (розетки ${idx})`
      } else if (breaker.id.includes('light')) {
        groupName = `${room.name} (освещение)`
      } else if (breaker.id.includes('load_')) {
        const loadKey = breaker.id.split('load_').pop() || ''
        const loadLabels: Record<string, string> = {
          washer: 'стиральная машина',
          dryer: 'сушильная машина',
          dishwasher: 'посудомоечная машина',
          refrigerator: 'холодильник',
          ac: 'кондиционер',
          boiler: 'водонагреватель',
          water_heater: 'бойлер',
          electric_floor: 'тёплый пол',
          cooktop: 'варочная панель',
          oven: 'духовой шкаф',
          sauna: 'сауна',
          ventilation: 'вентиляция',
          outdoor_socket: 'уличная розетка',
        }
        groupName = `${room.name} (${loadLabels[loadKey] || loadKey})`
      }

      // Номинал дифа: берём номинал автомата, но не выше 25А для дифов
      const diffRating = Math.min(breaker.rating, 25) as 10 | 25 | 40 | 63

      // Формируем обоснование
      const reasons: string[] = [
        `Индивидуальный дифавтомат ${diffRating}А/${leakage}мА на "${groupName}".`
      ]
      if (isWetRoom) {
        reasons.push(`Влажное помещение — УЗО 10мА (ПУЭ 7.1.83).`)
      }
      if (isWaterRelated) {
        reasons.push(`Прибор связан с водой — УЗО 10мА (ПУЭ 7.1.83).`)
      }
      reasons.push(`Максимальная селективность: при срабатывании отключается только одна линия.`)

      return createDiffBreaker(
        `diff_${breaker.id}`,
        diffRating,
        leakage,
        groupName,
        reasons.join(' ')
      )
    })
  }

  // Обработка стратегии 'everything_separated' — индивидуальные дифы на КАЖДЫЙ breaker
  if (bathroomStrategy === 'everything_separated') {
    const allDiffs: RCD[] = rooms.flatMap(makeSeparatedDiffs)

    return {
      strategy: 'grouped',
      devices: allDiffs,
      explanation:
        `Выбрана максимальная схема защиты «Всё раздельно»: индивидуальный дифавтомат на КАЖДУЮ линию. ` +
        `Всего ${allDiffs.length} дифавтоматов. ` +
        `Влажные помещения — УЗО 10мА (ПУЭ 7.1.83). Приборы, связанные с водой (стиральная, ` +
        `посудомоечная, водонагреватель) — УЗО 10мА независимо от помещения. ` +
        `Преимущество: при срабатывании отключается ТОЛЬКО одна линия — остальные продолжают работать. ` +
        `Недостаток: больше дифавтоматов = больше места в щитке.`
    }
  }

  // Для маленьких квартир (≤8 групп) — одно вводное УЗО
  if (totalGroups <= 8) {
    // Водозависимые приборы → индивидуальные дифы (для стратегии 'separate')
    const waterRelatedDiffs = bathroomStrategy === 'separate' ? makeWaterRelatedDiffs() : []
    const waterRelatedIds = new Set(waterRelatedDiffs.map(d => d.id.replace(/^diff_/, '')))

    const mainRCD = createRCD(
      'rcd_main',
      selectRCDRating(groupBreakers),
      30,
      groupBreakers.map(b => b.group),
      `Вводное УЗО 30мА защищает все группы. `
        + `Для квартир до 8 групп — оптимальное решение по стоимости. `
        + `ПУЭ 7.1.83.`
    )

    const wetRoomDiffs: RCD[] = rooms
      .filter(r => HIGH_RISK_ROOMS.includes(r.type))
      .flatMap(r => makeWetRoomDiffs(r, waterRelatedIds))

    const strategyLabel = bathroomStrategy === 'economy'
      ? `один диф на влажное помещение (розетки+свет через него)`
      : `отдельные дифавтоматы на розетки и на свет в каждом влажном помещении`

    const extraSeparate = waterRelatedDiffs.length > 0
      ? `\nДополнительно: индивидуальные дифавтоматы 10мА на водозависимые приборы (стиральная, посудомоечная, водонагреватель).`
      : ``

    return {
      strategy: 'single',
      devices: [mainRCD, ...waterRelatedDiffs, ...wetRoomDiffs],
      explanation: `Выбрана схема с одним вводным УЗО ${mainRCD.ratingAmps}А/30мА для всей квартиры. `
        + `Влажные помещения: ${strategyLabel}. ${extraSeparate}`
        + `При срабатывании вводного УЗО отключится вся квартира — это нормально для данной схемы.`
    }
  }

  // Для больших квартир — групповые УЗО по зонам
  const zones = {
    wet: rooms.filter(r => HIGH_RISK_ROOMS.includes(r.type)),
    kitchen: rooms.filter(r => r.type === 'kitchen'),
    living: rooms.filter(r => !HIGH_RISK_ROOMS.includes(r.type) && r.type !== 'kitchen')
  }

  const devices: RCD[] = []

  // Водозависимые приборы → индивидуальные дифы (для стратегии 'separate')
  const waterRelatedDiffs = bathroomStrategy === 'separate' ? makeWaterRelatedDiffs() : []
  const waterRelatedIds = new Set(waterRelatedDiffs.map(d => d.id.replace(/^diff_/, '')))

  // Влажные помещения — по выбранной стратегии
  if (zones.wet.length > 0) {
    zones.wet.forEach(room => {
      const wetDiffs = makeWetRoomDiffs(room, waterRelatedIds)
      devices.push(...wetDiffs)
    })
  }

  // Кухня — фильтруем водозависимые приборы, у них свои дифы
  if (zones.kitchen.length > 0) {
    let kitchenBreakers = groupBreakers.filter(b =>
      zones.kitchen.some(r => b.id.startsWith(r.id))
    )
    kitchenBreakers = kitchenBreakers.filter(b => !waterRelatedIds.has(b.id))
    if (kitchenBreakers.length > 0) {
      devices.push(createRCD(
        'rcd_kitchen',
        selectRCDRating(kitchenBreakers),
        30,
        kitchenBreakers.map(b => b.group),
        `УЗО 30мА для кухни — повышенная влажность, риск поражения током (ПУЭ 7.1.83).`
      ))
    }
  }

  // Жилые комнаты — фильтруем водозависимые приборы
  let livingBreakers = groupBreakers.filter(b =>
    zones.living.some(r => b.id.startsWith(r.id))
  )
  livingBreakers = livingBreakers.filter(b => !waterRelatedIds.has(b.id))
  if (livingBreakers.length > 0) {
    devices.push(createRCD(
      'rcd_living',
      selectRCDRating(livingBreakers),
      30,
      livingBreakers.map(b => b.group),
      `УЗО 30мА для жилых комнат и коридора. Стандартная защита (ПУЭ 7.1.83).`
    ))
  }

  // Добавляем индивидуальные дифы водозависимых приборов
  devices.push(...waterRelatedDiffs)

  const strategyLabel = bathroomStrategy === 'economy'
    ? `один диф на влажное помещение (розетки+свет через него)`
    : `отдельные дифавтоматы на розетки и на свет`

  const extraSeparate = waterRelatedDiffs.length > 0 && bathroomStrategy === 'separate'
    ? `\nДополнительно: индивидуальные дифавтоматы 10мА на водозависимые приборы (стиральная, посудомоечная, водонагреватель).`
    : ``

  return {
    strategy: 'grouped',
    devices,
    explanation: `Выбрана схема с групповыми УЗО по зонам. `
      + `Влажные помещения: ${strategyLabel}. `
      + `${extraSeparate}`
      + `Преимущество: при срабатывании отключается только одна зона. `
      + `ПУЭ 7.1.83.`
  }
}
