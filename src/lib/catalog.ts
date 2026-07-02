// src/lib/catalog.ts
// Каталог артикулов производителей (ABB и Dekraft)

export type Manufacturer = 'abb' | 'dekraft'

interface CatalogEntry {
  abb: string
  dekraft: string
}

/**
 * Поиск артикула по параметрам устройства.
 * Возвращает артикул для выбранного производителя.
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
  const key = buildKey(params)
  const entry = CATALOG[key]
  if (!entry) return '—'
  return entry[manufacturer]
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
  // ── Вводные автоматы (2P/3P, B, ABB SH200 / Dekraft VA47-29) ──
  'main_breaker_2P_25A_B': {
    abb: '2CDS252001R0255',
    dekraft: 'VA47-29 2P 25A B',
  },
  'main_breaker_2P_32A_B': {
    abb: '2CDS252001R0325',
    dekraft: 'VA47-29 2P 32A B',
  },
  'main_breaker_2P_40A_B': {
    abb: '2CDS252001R0405',
    dekraft: 'VA47-29 2P 40A B',
  },
  'main_breaker_2P_50A_B': {
    abb: '2CDS252001R0505',
    dekraft: 'VA47-29 2P 50A B',
  },
  'main_breaker_2P_63A_B': {
    abb: '2CDS252001R0635',
    dekraft: 'VA47-29 2P 63A B',
  },
  'main_breaker_3P_25A_B': {
    abb: '2CDS253001R0255',
    dekraft: 'VA47-29 3P 25A B',
  },
  'main_breaker_3P_32A_B': {
    abb: '2CDS253001R0325',
    dekraft: 'VA47-29 3P 32A B',
  },
  'main_breaker_3P_40A_B': {
    abb: '2CDS253001R0405',
    dekraft: 'VA47-29 3P 40A B',
  },
  'main_breaker_3P_50A_B': {
    abb: '2CDS253001R0505',
    dekraft: 'VA47-29 3P 50A B',
  },
  'main_breaker_3P_63A_B': {
    abb: '2CDS253001R0635',
    dekraft: 'VA47-29 3P 63A B',
  },

  // ── Групповые автоматы (1P, C, ABB S201 / Dekraft VA47-29) ──
  'circuit_breaker_1P_6A_C': {
    abb: '2CDS251001R0064',
    dekraft: 'VA47-29 1P 6A C',
  },
  'circuit_breaker_1P_10A_C': {
    abb: '2CDS251001R0104',
    dekraft: 'VA47-29 1P 10A C',
  },
  'circuit_breaker_1P_16A_C': {
    abb: '2CDS251001R0164',
    dekraft: 'VA47-29 1P 16A C',
  },
  'circuit_breaker_1P_20A_C': {
    abb: '2CDS251001R0204',
    dekraft: 'VA47-29 1P 20A C',
  },
  'circuit_breaker_1P_25A_C': {
    abb: '2CDS251001R0254',
    dekraft: 'VA47-29 1P 25A C',
  },
  'circuit_breaker_1P_32A_C': {
    abb: '2CDS251001R0324',
    dekraft: 'VA47-29 1P 32A C',
  },
  'circuit_breaker_1P_40A_C': {
    abb: '2CDS251001R0404',
    dekraft: 'VA47-29 1P 40A C',
  },

  // ── Групповые автоматы (1P, B, для освещения) ──
  'circuit_breaker_1P_10A_B': {
    abb: '2CDS251001R0105',
    dekraft: 'VA47-29 1P 10A B',
  },

  // ── 2P автоматы (мощные нагрузки) ──
  'circuit_breaker_2P_25A_C': {
    abb: '2CDS252001R0254',
    dekraft: 'VA47-29 2P 25A C',
  },
  'circuit_breaker_2P_32A_C': {
    abb: '2CDS252001R0324',
    dekraft: 'VA47-29 2P 32A C',
  },

  // ── УЗО (2P, ABB F202 / Dekraft VD1-63) ──
  'rcd_2P_25A_30mA': {
    abb: '2CSF202001R1250',
    dekraft: 'VD1-63 2P 25A 30mA',
  },
  'rcd_2P_40A_30mA': {
    abb: '2CSF202001R1400',
    dekraft: 'VD1-63 2P 40A 30mA',
  },
  'rcd_2P_63A_30mA': {
    abb: '2CSF202001R1630',
    dekraft: 'VD1-63 2P 63A 30mA',
  },

  // ── Дифавтоматы 30мА (ABB DS201 / Dekraft AVDT-63) ──
  'diff_breaker_2P_6A_30mA': {
    abb: '2CSF202001R1060',
    dekraft: 'AVDT-63 1P+N 6A 30mA',
  },
  'diff_breaker_2P_10A_30mA': {
    abb: '2CSF202001R1100',
    dekraft: 'AVDT-63 1P+N 10A 30mA',
  },
  'diff_breaker_2P_16A_30mA': {
    abb: '2CSF202001R1160',
    dekraft: 'AVDT-63 1P+N 16A 30mA',
  },
  'diff_breaker_2P_20A_30mA': {
    abb: '2CSF202001R1200',
    dekraft: 'AVDT-63 1P+N 20A 30mA',
  },
  'diff_breaker_2P_25A_30mA': {
    abb: '2CSF202001R1250',
    dekraft: 'AVDT-63 1P+N 25A 30mA',
  },

  // ── Дифавтоматы 10мА (влажные помещения, ABB DS201 / Dekraft AVDT-63) ──
  'diff_breaker_2P_6A_10mA': {
    abb: '2CSF202001R2060',
    dekraft: 'AVDT-63 1P+N 6A 10mA',
  },
  'diff_breaker_2P_10A_10mA': {
    abb: '2CSF202001R2100',
    dekraft: 'AVDT-63 1P+N 10A 10mA',
  },
  'diff_breaker_2P_16A_10mA': {
    abb: '2CSF202001R2160',
    dekraft: 'AVDT-63 1P+N 16A 10mA',
  },
  'diff_breaker_2P_20A_10mA': {
    abb: '2CSF202001R2200',
    dekraft: 'AVDT-63 1P+N 20A 10mA',
  },
  'diff_breaker_2P_25A_10mA': {
    abb: '2CSF202001R2250',
    dekraft: 'AVDT-63 1P+N 25A 10mA',
  },

  // ── Выключатель нагрузки / рубильник ──
  'load_break_switch_2P_25A': {
    abb: '2CDS212001R0254',
    dekraft: 'VN-29 2P 25A',
  },
  'load_break_switch_2P_32A': {
    abb: '2CDS212001R0324',
    dekraft: 'VN-29 2P 32A',
  },
  'load_break_switch_2P_40A': {
    abb: '2CDS212001R0404',
    dekraft: 'VN-29 2P 40A',
  },
  'load_break_switch_2P_50A': {
    abb: '2CDS212001R0504',
    dekraft: 'VN-29 2P 50A',
  },
  'load_break_switch_2P_63A': {
    abb: '2CDS212001R0634',
    dekraft: 'VN-29 2P 63A',
  },
  'load_break_switch_4P_25A': {
    abb: '2CDS214001R0254',
    dekraft: 'VN-29 4P 25A',
  },
  'load_break_switch_4P_32A': {
    abb: '2CDS214001R0324',
    dekraft: 'VN-29 4P 32A',
  },
  'load_break_switch_4P_40A': {
    abb: '2CDS214001R0404',
    dekraft: 'VN-29 4P 40A',
  },
  'load_break_switch_4P_50A': {
    abb: '2CDS214001R0504',
    dekraft: 'VN-29 4P 50A',
  },
  'load_break_switch_4P_63A': {
    abb: '2CDS214001R0634',
    dekraft: 'VN-29 4P 63A',
  },
}

/** Локализованные названия производителей */
export const MANUFACTURER_LABELS: Record<Manufacturer, string> = {
  abb: 'ABB',
  dekraft: 'Dekraft',
}
