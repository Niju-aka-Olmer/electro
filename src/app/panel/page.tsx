'use client'

import { useState, useMemo } from 'react'
import { useCalculatorStore } from '@/store/calculatorStore'
import Link from 'next/link'
import { RealisticPanel } from '@/components/panel/RealisticPanel'
import type { CircuitBreaker, RCD, LoadBreakSwitch, CalculationResult } from '@/types/electrical'
import UnderConstruction from '@/components/layout/UnderConstruction'

function isRCD(d: CircuitBreaker | RCD): d is RCD {
  return 'leakageMA' in d
}

/** Единая строка спецификации */
interface SpecRow {
  id: string
  ref: string       // QF1, QF2, F1, AD1, QS1
  type: string
  group: string
  rating: string
  phase: string
  modules: number
}

/** Формируем строки спецификации в порядке щитка */
function buildSpec(inOrderIds: string[], result: CalculationResult): SpecRow[] {
  const { mainBreaker, loadBreakSwitch, devices, panelEquipment } = result

  // Индексация по id
  const byId = new Map<string, CircuitBreaker | RCD | LoadBreakSwitch>()
  byId.set(mainBreaker.id, mainBreaker)
  if (loadBreakSwitch) byId.set(loadBreakSwitch.id, loadBreakSwitch)
  for (const d of devices) byId.set(d.id, d)

  let qfIndex = 2 // QF2 — первый групповой автомат после вводного (QF1)
  const rows: SpecRow[] = []

  for (const id of inOrderIds) {
    // Оборудование щитка (без автомата)
    if (id.startsWith('eq_')) {
      const eq = panelEquipment?.find(e => `eq_${e.id}` === id)
      if (eq) {
        rows.push({
          id: `eq_${eq.id}`, ref: '—', type: 'Обор.',
          group: eq.name,
          rating: `${eq.modules} модуля`,
          phase: '—',
          modules: eq.modules,
        })
      }
      continue
    }

    const d = byId.get(id)
    if (!d) continue

    if ('type' in d && d.type === 'load_break_switch') {
      const ls = d as LoadBreakSwitch
      rows.push({
        id: ls.id, ref: 'QS1', type: 'Рубильник',
        group: ls.group,
        rating: `${ls.rating}А / ${ls.poles}P`,
        phase: ls.phase || '—',
        modules: ls.modules,
      })
    } else if (isRCD(d as CircuitBreaker | RCD)) {
      const r = d as RCD
      const ref = r.type === 'diff_breaker' ? 'AD1' : 'F1'
      rows.push({
        id: r.id, ref, type: r.type === 'diff_breaker' ? 'Диф' : 'УЗО',
        group: r.protectedGroups.join(', '),
        rating: `${r.ratingAmps}А / ${r.leakageMA}мА`,
        phase: r.phase || '—',
        modules: r.modules,
      })
    } else {
      const b = d as CircuitBreaker
      const ref = b.id === 'main' ? 'QF1' : `QF${qfIndex++}`
      rows.push({
        id: b.id, ref, type: b.id === 'main' ? 'Ввод' : 'Авт',
        group: b.group,
        rating: `${b.rating}А (${b.characteristic})`,
        phase: b.phase || '—',
        modules: b.modules,
      })
    }
  }

  return rows
}

/** Цвета строк по типу устройства */
function rowStyle(type: string): string {
  switch (type) {
    case 'Рубильник': return 'bg-yellow-50 dark:bg-yellow-950/20'
    case 'Ввод': return 'bg-pink-50 dark:bg-pink-950/20'
    case 'УЗО': return 'bg-orange-50 dark:bg-orange-950/20'
    case 'Диф': return 'bg-cyan-50 dark:bg-cyan-950/20'
    case 'Обор.': return 'bg-gray-50 dark:bg-gray-950/10'
    default: return ''
  }
}

function typeTag(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case 'Рубильник': return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' }
    case 'Ввод': return { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' }
    case 'УЗО': return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' }
    case 'Диф': return { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800' }
    case 'Обор.': return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' }
    default: return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' }
  }
}

export default function PanelPage() {
  const result = useCalculatorStore(s => s.result)
  const [panelOrder, setPanelOrder] = useState<string[]>([])

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Расчёт щитка</h1>
        <p className="mt-4 text-text-secondary">
          Сначала выполните расчёт, чтобы увидеть компоновку щитка.
        </p>
        <Link
          href="/calculator"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-amber/90"
        >
          Перейти к расчёту →
        </Link>
      </div>
    )
  }

  const { recommendedPanelModules, panelRows, supplyPhases, warnings, notes } = result

  // Строим спецификацию в порядке щитка (или дефолтном, если ещё не получен)
  const specRows = useMemo(() => {
    if (panelOrder.length > 0) return buildSpec(panelOrder, result)
    // Дефолтный порядок до получения из панели
    const defaultOrder: string[] = []
    if (result.loadBreakSwitch) defaultOrder.push(result.loadBreakSwitch.id)
    defaultOrder.push(result.mainBreaker.id)
    // Оборудование щитка — сразу после вводного
    if (result.panelEquipment) {
      for (const eq of result.panelEquipment) {
        defaultOrder.push(`eq_${eq.id}`)
      }
    }
    for (const d of result.devices) {
      if (d.id !== 'main' && d.id !== 'load_break') defaultOrder.push(d.id)
    }
    return buildSpec(defaultOrder, result)
  }, [panelOrder, result])

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-scheme { break-inside: avoid; }
          .print-spec { break-inside: avoid; }
          @page { margin: 15mm; }
        }
      `}</style>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Шапка */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Электрический щит</h1>
          <p className="mt-1 text-text-secondary">
            {supplyPhases === 3 ? '3 фазы' : '1 фаза'} · {recommendedPanelModules} модулей · {panelRows} ряда
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UnderConstruction />
          <button
            onClick={() => window.print()}
            title="Распечатать"
            className="no-print inline-flex items-center justify-center rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-bg-elevated"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <Link
            href="/calculator"
            className="no-print inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
          >
            ← Назад к расчёту
          </Link>
        </div>
      </div>

      {/* Схема щитка */}
      <div className="print-scheme mb-8 overflow-x-auto rounded-xl bg-transparent">
        <h2 className="mb-4 text-lg font-semibold font-display">Схема щитка (Интерактивная)</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Перетаскивайте элементы для изменения порядка. Номера в спецификации синхронизируются.
        </p>
        <RealisticPanel result={result} onOrderChange={setPanelOrder} />
      </div>

      {/* Спецификация (по порядку щитка) */}
      <div className="print-spec mb-8 rounded-xl border border-border bg-bg-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold font-display">Спецификация</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                <th className="px-3 py-2 w-10">№</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Группа</th>
                <th className="px-3 py-2">Номинал</th>
                <th className="px-3 py-2">Фаза</th>
                <th className="px-3 py-2">Мод</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {specRows.map(row => {
                const tag = typeTag(row.type)
                return (
                  <tr key={row.id} className={rowStyle(row.type)}>
                    <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-text-muted">{row.ref}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-md border ${tag.border} ${tag.bg} px-2 py-0.5 text-[11px] ${tag.text}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{row.group}</td>
                    <td className="px-3 py-2.5">{row.rating}</td>
                    <td className="px-3 py-2.5 text-[11px] text-text-muted">{row.phase}</td>
                    <td className="px-3 py-2.5">{row.modules}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Подключение фаз (только для 3-фазных) */}
      {result.phaseAssignment && result.phaseAssignment.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-6">
          <h2 className="mb-4 text-lg font-semibold font-display">Распределение по фазам</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {(['L1', 'L2', 'L3'] as const).map(phase => {
              const phaseDevices = result.phaseAssignment!.filter(a => a.phase.includes(phase))
              const phaseColor = phase === 'L1' ? 'text-red-600' : phase === 'L2' ? 'text-amber-600' : 'text-purple-600'
              const bgColor = phase === 'L1' ? 'bg-red-50 dark:bg-red-950/20' : phase === 'L2' ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-purple-50 dark:bg-purple-950/20'
              const borderColor = phase === 'L1' ? 'border-red-200' : phase === 'L2' ? 'border-amber-200' : 'border-purple-200'
              return (
                <div key={phase} className={`rounded-lg border ${borderColor} ${bgColor} p-3`}>
                  <div className={`mb-1 font-bold ${phaseColor}`}>{phase}</div>
                  <div className="space-y-1">
                    {phaseDevices.length === 0 && <span className="text-text-muted">—</span>}
                    {phaseDevices.map(a => {
                      // Найти ref для этого устройства
                      const row = specRows.find(r => r.id === a.deviceId)
                      return (
                        <div key={a.deviceId} className="text-[12px] text-text-secondary">
                          {row?.ref || a.deviceId}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Предупреждения и примечания */}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
          <h3 className="mb-2 font-semibold text-accent-danger">Предупреждения</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      {notes.length > 0 && (
        <div className="rounded-xl border border-accent-info/30 bg-accent-info/5 p-4">
          <h3 className="mb-2 font-semibold text-accent-info">Примечания</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
    </>
  )
}
