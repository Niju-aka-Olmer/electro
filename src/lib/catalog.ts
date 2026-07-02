// src/lib/catalog.ts
// Каталог артикулов производителей (ABB и Dekraft)

export type Manufacturer = 'abb' | 'dekraft'

interface CatalogEntry {
  abb: string
  abbName: string   // полное название ABB
  dekraft: string
  dekraftName: string // полное название Dekraft
}

/**
 * Поиск артикула по параметрам устройства.
 */
function findEntry(params: {
  type: string
  poles: number
  rating: number
  characteristic?: string
  leakageMA?: number
}): CatalogEntry | undefined {
  const key = buildKey(params)
  return CATALOG[key]
}

/**
 * Получить артикул для выбранного производителя.
 */
export function getArticle(
  manufacturer: Manufacturer,
  params: {
    type: 'main_breaker' | 'circuit_breaker' | 'rcd' | 'diff_breaker' | 'load_break_switch'
    poles: number
    rating: number
    characteristic?: string
    leakageMA?: number
  }
): string {
  const entry = findEntry(params)
  if (!entry) return '—'
  return entry[manufacturer]
}

/**
 * Получить полное название устройства с артикулом.
 * Пример: «УЗО ABB F202 A-63/0.03 63А 30mA (2CSF202101R1630)»
 */
export function getFullName(
  manufacturer: Manufacturer,
  params: {
    type: 'main_breaker' | 'circuit_breaker' | 'rcd' | 'diff_breaker' | 'load_break_switch'
    poles: number
    rating: number
    characteristic?: string
    leakageMA?: number
  }
): string {
  const entry = findEntry(params)
  if (!entry) return `—`
  const name = entry[`${manufacturer}Name` as 'abbName' | 'dekraftName']
  const article = entry[manufacturer]
  return `${name} (${article})`
}

/** Названия производителей */
export const MANUFACTURER_LABELS: Record<Manufacturer, string> = {
  abb: 'ABB',
  dekraft: 'Dekraft',
}

function buildKey(p: {
  type: string
  poles: number
  rating: number
  characteristic?: string
  leakageMA?: number
}): string {
  const parts = [p.type, `${p.poles}P`, `${p.rating}A`]
  if (p.characteristic) parts.push(p.characteristic)
  if (p.leakageMA) parts.push(`${p.leakageMA}mA`)
  return parts.join('_')
}

// ═══════════════════════════════════════════════════════════════
// Каталог
// ═══════════════════════════════════════════════════════════════

const CATALOG: Record<string, CatalogEntry> = {

  // ── Вводные автоматы 2P B (ABB S202 / Dekraft ВА-101) ──
  'main_breaker_2P_25A_B': {
    abb: '2CDS252001R0255',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 B25',
    dekraft: '11020DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P B25 4.5кА',
  },
  'main_breaker_2P_32A_B': {
    abb: '2CDS252001R0325',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 B32',
    dekraft: '11021DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P B32 4.5кА',
  },
  'main_breaker_2P_40A_B': {
    abb: '2CDS252001R0405',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 B40',
    dekraft: '11022DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P B40 4.5кА',
  },
  'main_breaker_2P_50A_B': {
    abb: '2CDS252001R0505',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 B50',
    dekraft: '11023DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P B50 4.5кА',
  },
  'main_breaker_2P_63A_B': {
    abb: '2CDS252001R0635',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 B63',
    dekraft: '11024DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P B63 4.5кА',
  },

  // ── Вводные автоматы 3P B ──
  'main_breaker_3P_25A_B': {
    abb: '2CDS253001R0255',
    abbName: 'Автоматический выключатель ABB 3-полюсный S203 B25',
    dekraft: '11075DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 3P B25 4.5кА',
  },
  'main_breaker_3P_32A_B': {
    abb: '2CDS253001R0325',
    abbName: 'Автоматический выключатель ABB 3-полюсный S203 B32',
    dekraft: '11076DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 3P B32 4.5кА',
  },
  'main_breaker_3P_40A_B': {
    abb: '2CDS253001R0405',
    abbName: 'Автоматический выключатель ABB 3-полюсный S203 B40',
    dekraft: '11077DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 3P B40 4.5кА',
  },
  'main_breaker_3P_50A_B': {
    abb: '2CDS253001R0505',
    abbName: 'Автоматический выключатель ABB 3-полюсный S203 B50',
    dekraft: '11078DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 3P B50 4.5кА',
  },
  'main_breaker_3P_63A_B': {
    abb: '2CDS253001R0635',
    abbName: 'Автоматический выключатель ABB 3-полюсный S203 B63',
    dekraft: '11079DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 3P B63 4.5кА',
  },

  // ── Групповые автоматы 1P C (ABB SH201 / Dekraft ВА-101) ──
  'circuit_breaker_1P_6A_C': {
    abb: '2CDS211001R0064',
    abbName: 'Автомат ABB SH201 C6 6A (C) 6kA',
    dekraft: '11051DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C6 4.5кА',
  },
  'circuit_breaker_1P_10A_C': {
    abb: '2CDS211001R0104',
    abbName: 'Автомат ABB SH201 C10 10A (C) 6kA',
    dekraft: '11053DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C10 4.5кА',
  },
  'circuit_breaker_1P_16A_C': {
    abb: '2CDS211001R0164',
    abbName: 'Автомат ABB SH201 C16 16A (C) 6kA',
    dekraft: '11054DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C16 4.5кА',
  },
  'circuit_breaker_1P_20A_C': {
    abb: '2CDS211001R0204',
    abbName: 'Автомат ABB SH201 C20 20A (C) 6kA',
    dekraft: '11055DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C20 4.5кА',
  },
  'circuit_breaker_1P_25A_C': {
    abb: '2CDS211001R0254',
    abbName: 'Автомат ABB SH201 C25 25A (C) 6kA',
    dekraft: '11056DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C25 4.5кА',
  },
  'circuit_breaker_1P_32A_C': {
    abb: '2CDS211001R0324',
    abbName: 'Автомат ABB SH201 C32 32A (C) 6kA',
    dekraft: '11057DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C32 4.5кА',
  },
  'circuit_breaker_1P_40A_C': {
    abb: '2CDS211001R0404',
    abbName: 'Автомат ABB SH201 C40 40A (C) 6kA',
    dekraft: '11058DEK',
    dekraftName: 'Автоматический выключатель Dekraft 1P ВА-101 C40 4.5кА',
  },

  // ── Групповые автоматы 1P B (освещение) ──
  'circuit_breaker_1P_10A_B': {
    abb: '2CDS211001R0105',
    abbName: 'Автомат ABB SH201 B10 10A (B) 6kA',
    dekraft: '11005DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 1P B10 4.5кА',
  },

  // ── 2P автоматы C (мощные нагрузки) ──
  'circuit_breaker_2P_25A_C': {
    abb: '2CDS212001R0254',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 C25',
    dekraft: '11068DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P C25 4.5кА',
  },
  'circuit_breaker_2P_32A_C': {
    abb: '2CDS212001R0324',
    abbName: 'Автоматический выключатель ABB 2-полюсный S202 C32',
    dekraft: '11069DEK',
    dekraftName: 'Автоматический выключатель Dekraft ВА-101 2P C32 4.5кА',
  },

  // ── УЗО 30мА (ABB F202 / Dekraft ВДТ) ──
  'rcd_2P_25A_30mA': {
    abb: '2CSF202101R1250',
    abbName: 'УЗО ABB F202 A-25/0.03 25А 30mA (А)',
    dekraft: '14207DEK',
    dekraftName: 'УЗО Dekraft 2P ВДТ 25A 30mA',
  },
  'rcd_2P_40A_30mA': {
    abb: '2CSF202101R1400',
    abbName: 'УЗО ABB F202 A-40/0.03 40А 30mA (А)',
    dekraft: '14208DEK',
    dekraftName: 'УЗО Dekraft 2P ВДТ 40A 30mA',
  },
  'rcd_2P_63A_30mA': {
    abb: '2CSF202101R1630',
    abbName: 'УЗО ABB F202 A-63/0.03 63А 30mA (А)',
    dekraft: '14209DEK',
    dekraftName: 'УЗО Dekraft 2P ВДТ 63A 30mA',
  },

  // ── Дифавтоматы (ABB DSH201R / Dekraft ДИФ-103) ──
  'diff_breaker_2P_6A_30mA': {
    abb: '2CSR245072R1064',
    abbName: 'DSH201R C6 30mA Дифференциальный автомат ABB 2-полюсный 6A 30mA тип АС',
    dekraft: '16586DEK',
    dekraftName: 'АВДТ Dekraft ДИФ-103 1P+N C6 30mA AC 4.5kA',
  },
  'diff_breaker_2P_10A_30mA': {
    abb: '2CSR245072R1104',
    abbName: 'DSH201R C10 30mA Дифференциальный автомат ABB 2-полюсный 10A 30mA тип АС',
    dekraft: '16587DEK',
    dekraftName: 'АВДТ Dekraft ДИФ-103 1P+N C10 30mA AC 4.5kA',
  },
  'diff_breaker_2P_16A_30mA': {
    abb: '2CSR245072R1164',
    abbName: 'DSH201R C16 30mA Дифференциальный автомат ABB 2-полюсный 16A 30mA тип АС',
    dekraft: '16588DEK',
    dekraftName: 'АВДТ Dekraft ДИФ-103 1P+N C16 30mA AC 4.5kA',
  },
  'diff_breaker_2P_20A_30mA': {
    abb: '2CSR245072R1204',
    abbName: 'DSH201R C20 30mA Дифференциальный автомат ABB 2-полюсный 20A 30mA тип АС',
    dekraft: '16589DEK',
    dekraftName: 'АВДТ Dekraft ДИФ-103 1P+N C20 30mA AC 4.5kA',
  },
  'diff_breaker_2P_25A_30mA': {
    abb: '2CSR245072R1254',
    abbName: 'DSH201R C25 30mA Дифференциальный автомат ABB 2-полюсный 25A 30mA тип АС',
    dekraft: '16590DEK',
    dekraftName: 'АВДТ Dekraft ДИФ-103 1P+N C25 30mA AC 4.5kA',
  },

  // ── Выключатель нагрузки / рубильник (ABB S200 / Dekraft ВН) ──
  'load_break_switch_2P_25A': {
    abb: '2CDS212001R0254',
    abbName: 'Выключатель нагрузки ABB 2P S202 25A',
    dekraft: '12030DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 2P ВН-29 25A',
  },
  'load_break_switch_2P_32A': {
    abb: '2CDS212001R0324',
    abbName: 'Выключатель нагрузки ABB 2P S202 32A',
    dekraft: '12031DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 2P ВН-29 32A',
  },
  'load_break_switch_2P_40A': {
    abb: '2CDS212001R0404',
    abbName: 'Выключатель нагрузки ABB 2P S202 40A',
    dekraft: '12032DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 2P ВН-29 40A',
  },
  'load_break_switch_2P_50A': {
    abb: '2CDS212001R0504',
    abbName: 'Выключатель нагрузки ABB 2P S202 50A',
    dekraft: '12033DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 2P ВН-29 50A',
  },
  'load_break_switch_2P_63A': {
    abb: '2CDS212001R0634',
    abbName: 'Выключатель нагрузки ABB 2P S202 63A',
    dekraft: '12034DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 2P ВН-29 63A',
  },
  'load_break_switch_4P_25A': {
    abb: '2CDS214001R0254',
    abbName: 'Выключатель нагрузки ABB 4P S204 25A',
    dekraft: '12050DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 4P ВН-29 25A',
  },
  'load_break_switch_4P_32A': {
    abb: '2CDS214001R0324',
    abbName: 'Выключатель нагрузки ABB 4P S204 32A',
    dekraft: '12051DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 4P ВН-29 32A',
  },
  'load_break_switch_4P_40A': {
    abb: '2CDS214001R0404',
    abbName: 'Выключатель нагрузки ABB 4P S204 40A',
    dekraft: '12052DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 4P ВН-29 40A',
  },
  'load_break_switch_4P_50A': {
    abb: '2CDS214001R0504',
    abbName: 'Выключатель нагрузки ABB 4P S204 50A',
    dekraft: '12053DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 4P ВН-29 50A',
  },
  'load_break_switch_4P_63A': {
    abb: '2CDS214001R0634',
    abbName: 'Выключатель нагрузки ABB 4P S204 63A',
    dekraft: '12054DEK',
    dekraftName: 'Выключатель нагрузки Dekraft 4P ВН-29 63A',
  },
}
