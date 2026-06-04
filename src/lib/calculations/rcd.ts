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
 */
export function generateRCDStrategy(
  rooms: RoomConfig[],
  groupBreakers: CircuitBreaker[],
  bathroomStrategy: 'economy' | 'separate' = 'economy'
): {
  strategy: 'single' | 'grouped'
  devices: RCD[]
  explanation: string
} {
  const totalGroups = groupBreakers.length

  /** Создать устройства для влажной комнаты по выбранной стратегии */
  function makeWetRoomDiffs(room: RoomConfig): RCD[] {
    const socketBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('socket'))
    const lightBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('light'))
    const loadBreakers = groupBreakers.filter(b => b.id.startsWith(room.id) && b.id.includes('load'))

    if (bathroomStrategy === 'separate') {
      // Вариант Б: 2 отдельных дифа — на розетки и на свет
      const result: RCD[] = []

      if (socketBreakers.length > 0 || loadBreakers.length > 0) {
        const allPowerBreakers = [...socketBreakers, ...loadBreakers]
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
          10,
          `${room.name} (освещение)`,
          `Дифавтомат ${Math.min(maxLightRating, 25)}А/10мА на освещение в ${room.name}. ` +
          `Отдельный диф — при срабатывании розеток свет остаётся включённым (ПУЭ 7.1.83).`
        ))
      }

      return result
    }

    // Вариант А (economy): один диф на всё влажное помещение
    const roomBreakers = groupBreakers.filter(b => b.id.startsWith(room.id))
    const maxRating = Math.max(...roomBreakers.map(b => b.rating), 16)
    const diffRating = Math.min(maxRating, 25) as 10 | 25 | 40 | 63

    // Этот диф защищает все группы в помещении
    // (автоматы на розетки, свет и технику стоят после него)
    return [createDiffBreaker(
      `diff_${room.id}`,
      diffRating,
      10,
      room.name,
      `Дифавтомат ${diffRating}А/10мА в ${room.name} — защищает все линии в помещении. ` +
      `Эконом-вариант: один диф на розетки, свет и технику. ` +
      `При срабатывании всё помещение обесточивается (ПУЭ 7.1.83).`
    )]
  }

  // Для маленьких квартир (≤8 групп) — одно вводное УЗО
  if (totalGroups <= 8) {
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
      .flatMap(makeWetRoomDiffs)

    const strategyLabel = bathroomStrategy === 'economy'
      ? `один диф на влажное помещение (розетки+свет через него)`
      : `отдельные дифавтоматы на розетки и на свет в каждом влажном помещении`

    return {
      strategy: 'single',
      devices: [mainRCD, ...wetRoomDiffs],
      explanation: `Выбрана схема с одним вводным УЗО ${mainRCD.ratingAmps}А/30мА для всей квартиры. `
        + `Влажные помещения: ${strategyLabel}. `
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

  // Влажные помещения — по выбранной стратегии
  if (zones.wet.length > 0) {
    zones.wet.forEach(room => {
      const wetDiffs = makeWetRoomDiffs(room)
      devices.push(...wetDiffs)
    })
  }

  if (zones.kitchen.length > 0) {
    const kitchenBreakers = groupBreakers.filter(b =>
      zones.kitchen.some(r => b.id.startsWith(r.id))
    )
    devices.push(createRCD(
      'rcd_kitchen',
      selectRCDRating(kitchenBreakers),
      30,
      kitchenBreakers.map(b => b.group),
      `УЗО 30мА для кухни — повышенная влажность, риск поражения током (ПУЭ 7.1.83).`
    ))
  }

  const livingBreakers = groupBreakers.filter(b =>
    zones.living.some(r => b.id.startsWith(r.id))
  )
  if (livingBreakers.length > 0) {
    devices.push(createRCD(
      'rcd_living',
      selectRCDRating(livingBreakers),
      30,
      livingBreakers.map(b => b.group),
      `УЗО 30мА для жилых комнат и коридора. Стандартная защита (ПУЭ 7.1.83).`
    ))
  }

  const strategyLabel = bathroomStrategy === 'economy'
    ? `один диф на влажное помещение (розетки+свет через него)`
    : `отдельные дифавтоматы на розетки и на свет`

  return {
    strategy: 'grouped',
    devices,
    explanation: `Выбрана схема с групповыми УЗО по зонам. `
      + `Влажные помещения: ${strategyLabel}. `
      + `Преимущество: при срабатывании отключается только одна зона. `
      + `ПУЭ 7.1.83.`
  }
}
