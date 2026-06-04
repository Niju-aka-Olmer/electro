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
 */
export function generateRCDStrategy(
  rooms: RoomConfig[],
  groupBreakers: CircuitBreaker[]
): {
  strategy: 'single' | 'grouped'
  devices: RCD[]
  explanation: string
} {
  const totalGroups = groupBreakers.length
  
  // Для маленьких квартир (≤8 групп) — одно вводное УЗО
  if (totalGroups <= 8) {
    const mainRCD = createRCD(
      'rcd_main',
      selectRCDRating(groupBreakers),
      30,
      groupBreakers.map(b => b.id),
      `Вводное УЗО 30мА защищает все группы. `
        + `Для квартир до 8 групп — оптимальное решение по стоимости. `
        + `ПУЭ 7.1.83.`
    )
    
    // Но ванная/туалет — дополнительно дифавтомат 10мА
    const wetRoomDiffs: RCD[] = rooms
      .filter(r => HIGH_RISK_ROOMS.includes(r.type))
      .map(room => {
        const roomBreakers = groupBreakers.filter(b => b.id.startsWith(room.id))
        return createDiffBreaker(
          `diff_${room.id}`,
          16,
          10,
          room.id,
          `Дифавтомат 16А/10мА в ${room.name} — обязателен для влажных помещений (ПУЭ 7.1.83). `
            + `Срабатывает быстрее УЗО 30мА, критично при контакте с водой.`
        )
      })

    return {
      strategy: 'single',
      devices: [mainRCD, ...wetRoomDiffs],
      explanation: `Выбрана схема с одним вводным УЗО ${mainRCD.ratingAmps}А/30мА для всей квартиры. `
        + `Влажные помещения дополнительно защищены дифавтоматами 10мА. `
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

  if (zones.wet.length > 0) {
    const wetBreakers = groupBreakers.filter(b =>
      zones.wet.some(r => b.id.startsWith(r.id))
    )
    devices.push(createRCD(
      'rcd_wet',
      selectRCDRating(wetBreakers),
      10,
      wetBreakers.map(b => b.id),
      `УЗО 10мА для ванной/туалета — обязательно (ПУЭ 7.1.83).`
    ))
  }

  if (zones.kitchen.length > 0) {
    const kitchenBreakers = groupBreakers.filter(b =>
      zones.kitchen.some(r => b.id.startsWith(r.id))
    )
    devices.push(createRCD(
      'rcd_kitchen',
      selectRCDRating(kitchenBreakers),
      30,
      kitchenBreakers.map(b => b.id),
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
      livingBreakers.map(b => b.id),
      `УЗО 30мА для жилых комнат и коридора. Стандартная защита (ПУЭ 7.1.83).`
    ))
  }

  return {
    strategy: 'grouped',
    devices,
    explanation: `Выбрана схема с групповыми УЗО по зонам. `
      + `Преимущество: при срабатывании отключается только одна зона. `
      + `Влажные помещения защищены УЗО 10мА, остальные — 30мА.`
  }
}
