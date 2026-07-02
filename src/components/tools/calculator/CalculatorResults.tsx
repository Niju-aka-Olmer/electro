'use client'

import { useCalculatorStore } from '@/store/calculatorStore'
import Link from 'next/link'
import type { CircuitBreaker, RCD } from '@/types/electrical'
import { cn } from '@/lib/utils'
import { getArticle, MANUFACTURER_LABELS, type Manufacturer } from '@/lib/catalog'

function isRCD(d: CircuitBreaker | RCD): d is RCD {
  return 'leakageMA' in d
}

function deviceLabel(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) return d.group
  if (d.type === 'diff_breaker') return `${d.protectedGroups.join(', ')} (Диф ${d.ratingAmps}А/${d.leakageMA}мА)`
  return `${d.protectedGroups.join(', ')} (УЗО ${d.ratingAmps}А/${d.leakageMA}мА)`
}

/** Тип устройства для каталога */
function deviceType(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) return d.type
  if (d.type === 'diff_breaker') return 'diff_breaker'
  return 'rcd'
}

/** Характеристика для каталога (УЗО/дифы передают ток утечки) */
function deviceChar(d: CircuitBreaker | RCD): string | undefined {
  if (!isRCD(d)) return d.characteristic
  return undefined
}

function deviceRating(d: CircuitBreaker | RCD): number {
  if (!isRCD(d)) return d.rating
  return d.ratingAmps
}

/** Получить артикул устройства */
function deviceArticle(d: CircuitBreaker | RCD, manufacturer: Manufacturer): string {
  return getArticle(manufacturer, {
    type: deviceType(d) as 'main_breaker' | 'circuit_breaker' | 'rcd' | 'diff_breaker' | 'load_break_switch',
    poles: d.poles,
    rating: deviceRating(d),
    characteristic: deviceChar(d),
    leakageMA: isRCD(d) ? d.leakageMA : undefined,
  })
}

/** Генерация раскладки по DIN-рейкам (12 модулей на рейку) */
function generateLayout(devices: (CircuitBreaker | RCD)[]) {
  const MODULES_PER_ROW = 12
  const rows: { device: CircuitBreaker | RCD; modules: number }[][] = []
  let currentRow: { device: CircuitBreaker | RCD; modules: number }[] = []
  let used = 0

  const addDevice = (d: CircuitBreaker | RCD) => {
    const mods = d.modules
    if (used + mods > MODULES_PER_ROW) {
      rows.push(currentRow)
      currentRow = []
      used = 0
    }
    currentRow.push({ device: d, modules: mods })
    used += mods
  }

  devices.forEach(addDevice)
  if (currentRow.length > 0) rows.push(currentRow)

  return rows
}

/** Цвет для типа устройства */
function deviceStyles(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) {
    if (d.type === 'main_breaker') return 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
    return 'bg-accent-info/10 border-accent-info/30 text-accent-info'
  }
  if (d.type === 'diff_breaker') return 'bg-accent-danger/10 border-accent-danger/30 text-accent-danger'
  return 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
}

/** Иконка типа */
function deviceTag(d: CircuitBreaker | RCD): { label: string; color: string } {
  if (!isRCD(d)) {
    if (d.type === 'main_breaker') return { label: 'Ввод', color: 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber' }
    return { label: 'Авт', color: 'border-accent-info/30 bg-accent-info/10 text-accent-info' }
  }
  if (d.type === 'diff_breaker') return { label: 'Диф', color: 'border-accent-danger/30 bg-accent-danger/10 text-accent-danger' }
  return { label: 'УЗО', color: 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber' }
}

/** Тип устройства строкой */
function deviceTypeLabel(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) {
    if (d.type === 'main_breaker') return 'Ввод'
    return 'Авт'
  }
  if (d.type === 'diff_breaker') return 'Диф'
  return 'УЗО'
}

/** Номинал строкой */
function deviceRatingLabel(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) return `${d.rating}А`
  return `${d.ratingAmps}А`
}

/** Характеристика строкой */
function deviceCharLabel(d: CircuitBreaker | RCD): string {
  if (!isRCD(d)) return d.characteristic
  return `${d.leakageMA}мА`
}

/** Модули */
function deviceModules(d: CircuitBreaker | RCD): number {
  return d.modules
}

/** Экспорт спецификации в XLSX */
async function exportToXlsx(
  devices: (CircuitBreaker | RCD)[],
  mainBreaker: CircuitBreaker,
  manufacturer: Manufacturer
) {
  const XLSX = await import('xlsx')
  
  const rows: Record<string, string | number>[] = []
  
  for (const d of devices) {
    const article = deviceArticle(d, manufacturer)
    rows.push({
      'Тип': deviceTypeLabel(d),
      'Назначение': !isRCD(d) ? d.group : d.protectedGroups.join(', '),
      'Номинал': deviceRatingLabel(d),
      'Хар-ка': deviceCharLabel(d),
      'Мод.': deviceModules(d),
      'Артикул': article,
    })
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  
  // Ширина колонок
  ws['!cols'] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 10 },
    { wch: 10 },
    { wch: 6 },
    { wch: 28 },
  ]

  const wb = XLSX.utils.book_new()
  const brand = MANUFACTURER_LABELS[manufacturer]
  XLSX.utils.book_append_sheet(wb, ws, `${brand}`)
  
  XLSX.writeFile(wb, `electroplan-${brand.toLowerCase()}.xlsx`)
}

export default function CalculatorResults() {
  const { result, input, setStep, reset, manufacturer, setManufacturer } = useCalculatorStore()
  const rooms = input.rooms ?? []

  if (!result) return null

  const { mainBreaker, devices, totalModules, recommendedPanelModules, panelEquipment, warnings, notes, explanation } = result

  const rcds = devices.filter(isRCD).filter(d => d.type === 'rcd')
  const diffDevices = devices.filter(isRCD).filter(d => d.type === 'diff_breaker')
  const groupBreakers = devices.filter(
    (d): d is CircuitBreaker => !isRCD(d) && d.id !== mainBreaker.id
  )
  const layout = generateLayout(devices)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Хидер */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-accent-amber">
            Результаты расчёта ⚡
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {rooms.map(r => r.name).join(' · ')} · {input.meterAmps}А ввод · {input.installationType === 'house' ? 'дом' : 'квартира'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToXlsx(devices, mainBreaker, manufacturer)}
            title="Скачать Excel"
            className="no-print inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={() => window.print()}
            title="Распечатать"
            className="no-print inline-flex items-center justify-center rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-bg-elevated"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button
            onClick={() => setStep(2)}
            className="no-print rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent-amber"
          >
            ← Назад
          </button>
          <button
            onClick={reset}
            className="no-print rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent-danger"
          >
            Сбросить
          </button>
          <Link
            href="/panel"
            className="no-print inline-flex items-center gap-1.5 rounded-lg bg-accent-amber px-5 py-2 text-sm font-semibold text-white hover:bg-accent-amber/90"
          >
            Перенести в Щиток →
          </Link>
        </div>
      </div>

      {/* Выбор производителя */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated p-3 no-print">
        <span className="text-xs font-medium text-text-secondary">Производитель:</span>
        {(Object.entries(MANUFACTURER_LABELS) as [Manufacturer, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setManufacturer(key)}
            className={cn(
              'rounded-lg border px-4 py-1.5 text-xs font-medium transition-all',
              manufacturer === key
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border bg-bg-surface text-text-muted hover:border-border-accent'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Итого */}
      <div className="grid gap-4 sm:grid-cols-5">
        {[
          { label: 'Модулей в щитке', value: `${totalModules}`, sub: 'мод.' },
          { label: 'Рекомендуемый щиток', value: `${recommendedPanelModules}`, sub: 'мод.' },
          { label: 'Автоматов', value: `${groupBreakers.length + 1}`, sub: 'шт.' },
          { label: 'УЗО/Диф', value: `${rcds.length + diffDevices.length}`, sub: 'шт.' },
          { label: 'Оборудование щитка', value: `${panelEquipment?.length ?? 0}`, sub: panelEquipment && panelEquipment.length > 0 ? panelEquipment.map(e => e.name).join(', ') : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-elevated p-4 text-center">
            <div className="text-2xl font-bold font-display text-accent-amber">{s.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{s.sub}</div>
            <div className="mt-1 text-xs text-text-secondary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Предупреждения */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
          <h3 className="mb-2 font-semibold text-accent-danger text-sm">⚠️ Предупреждения</h3>
          <ul className="space-y-1 text-sm text-text-secondary">
            {warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </div>
      )}

      {/* Примечания */}
      {notes.length > 0 && (
        <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-4">
          <h3 className="mb-2 font-semibold text-accent-amber text-sm">📋 Примечания</h3>
          <ul className="space-y-1 text-sm text-text-secondary">
            {notes.map((n, i) => <li key={i}>· {n}</li>)}
          </ul>
        </div>
      )}

      {/* Объяснение простым языком */}
      {explanation && (
        <div className="rounded-xl border border-border bg-bg-elevated p-5">
          <h3 className="mb-3 text-lg font-semibold font-display">📐 Почему именно так</h3>
          <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
            {explanation.split('\n').map((line, i) => {
              if (!line.trim()) return <div key={i} className="h-2" />
              if (line.startsWith('## ')) {
                return <h4 key={i} className="mt-4 mb-2 text-base font-semibold text-text-primary">{line.replace('## ', '')}</h4>
              }
              const parts = line.split(/(\*\*[^*]+\*\*)/g)
              return (
                <p key={i}>
                  {parts.map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j} className="text-text-primary">{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* Спецификация */}
      <div>
        <h3 className="mb-4 text-lg font-semibold font-display">Спецификация оборудования</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-elevated border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Тип</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Назначение</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Номинал</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Хар-ка</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Мод.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Артикул {MANUFACTURER_LABELS[manufacturer]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Вводной */}
              <tr className="bg-accent-amber/5">
                <td className="px-4 py-2.5">
                  <span className="rounded-md border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-[11px] text-accent-amber">
                    Ввод
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium">{mainBreaker.group}</td>
                <td className="px-4 py-2.5">{mainBreaker.rating}А</td>
                <td className="px-4 py-2.5">{mainBreaker.characteristic}</td>
                <td className="px-4 py-2.5">{mainBreaker.modules}</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted">{deviceArticle(mainBreaker, manufacturer)}</td>
              </tr>
              {/* УЗО */}
              {rcds.map((rcd, i) => (
                <tr key={rcd.id} className="bg-accent-amber/3">
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-[11px] text-accent-amber">
                      УЗО
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{deviceLabel(rcd)}</td>
                  <td className="px-4 py-2.5">{rcd.ratingAmps}А</td>
                  <td className="px-4 py-2.5">{rcd.leakageMA}мА</td>
                  <td className="px-4 py-2.5">{rcd.modules}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted">{deviceArticle(rcd, manufacturer)}</td>
                </tr>
              ))}
              {/* Дифы */}
              {diffDevices.map((diff, i) => (
                <tr key={diff.id} className="bg-accent-danger/3">
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-accent-danger/30 bg-accent-danger/10 px-2 py-0.5 text-[11px] text-accent-danger">
                      Диф
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{deviceLabel(diff)}</td>
                  <td className="px-4 py-2.5">{diff.ratingAmps}А</td>
                  <td className="px-4 py-2.5">{diff.leakageMA}мА</td>
                  <td className="px-4 py-2.5">{diff.modules}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted">{deviceArticle(diff, manufacturer)}</td>
                </tr>
              ))}
              {/* Групповые автоматы */}
              {groupBreakers.map((b, i) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-accent-info/30 bg-accent-info/10 px-2 py-0.5 text-[11px] text-accent-info">
                      Авт
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{b.group}</td>
                  <td className="px-4 py-2.5">{b.rating}А</td>
                  <td className="px-4 py-2.5">{b.characteristic}</td>
                  <td className="px-4 py-2.5">{b.modules}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted">{deviceArticle(b, manufacturer)}</td>
                </tr>
              ))}
              {/* Оборудование щитка (без автомата) */}
              {panelEquipment && panelEquipment.length > 0 && panelEquipment.map(eq => (
                <tr key={eq.id} className="bg-gray-50 dark:bg-gray-950/10">
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                      Обор.
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted italic">{eq.name}</td>
                  <td className="px-4 py-2.5 text-text-muted">—</td>
                  <td className="px-4 py-2.5 text-text-muted">—</td>
                  <td className="px-4 py-2.5">{eq.modules}</td>
                  <td className="px-4 py-2.5 text-text-muted">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Раскладка по DIN-рейкам */}
      <div>
        <h3 className="mb-4 text-lg font-semibold font-display">Раскладка по DIN-рейкам</h3>
        <div className="space-y-4">
          {layout.map((row, ri) => (
            <div key={ri}>
              <div className="mb-2 text-xs text-text-muted uppercase">Ряд {ri + 1} (DIN-рейка)</div>
              <div className="flex flex-wrap gap-1">
                {row.map((item, di) => {
                  const d = item.device
                  const tag = deviceTag(d)
                  return (
                    <div
                      key={di}
                      className={cn(
                        'flex items-center justify-center rounded-md border px-2 py-1.5 text-[11px] font-medium leading-tight text-center',
                        deviceStyles(d)
                      )}
                      title={tag.label + ': ' + deviceLabel(d)}
                      style={{ width: `${item.modules * 36}px`, minHeight: '36px' }}
                    >
                      {tag.label}
                      <br />
                      {'rating' in d ? `${d.rating}А` : `${d.ratingAmps}А`}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
