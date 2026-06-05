'use client'

import { useCalculatorStore } from '@/store/calculatorStore'
import Link from 'next/link'
import { PanelSvg } from '@/components/panel/PanelSvg'
import type { CircuitBreaker, RCD } from '@/types/electrical'
import { cn } from '@/lib/utils'

function isRCD(d: CircuitBreaker | RCD): d is RCD {
  return 'leakageMA' in d
}

export default function PanelPage() {
  const result = useCalculatorStore(s => s.result)

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold font-display">Расчёт щитка</h1>
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

  const { mainBreaker, loadBreakSwitch, devices, recommendedPanelModules, panelRows, supplyPhases, warnings, notes } = result

  // Сортировка устройств для сводки
  const rcds = devices.filter(d => d.type === 'rcd') as RCD[]
  const diffDevices = devices.filter(d => d.type === 'diff_breaker') as RCD[]
  const groupBreakers = devices.filter(d => d.type === 'circuit_breaker' && d.id !== 'main') as CircuitBreaker[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Шапка */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Электрический щит</h1>
          <p className="mt-1 text-text-secondary">
            {supplyPhases === 3 ? '3 фазы' : '1 фаза'} · {recommendedPanelModules} модулей · {panelRows} ряда
          </p>
        </div>
        <Link
          href="/calculator"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
        >
          ← Назад к расчёту
        </Link>
      </div>

      {/* SVG-схема щитка */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-bg-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold font-display">Схема щитка</h2>
        <PanelSvg result={result} />
      </div>

      {/* Спецификация */}
      <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold font-display">Спецификация</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Группа</th>
                <th className="px-3 py-2">Номинал</th>
                <th className="px-3 py-2">Фаза</th>
                <th className="px-3 py-2">Мод</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Рубильник */}
              {loadBreakSwitch && (
                <tr className="bg-yellow-50 dark:bg-yellow-950/20">
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Рубильник
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{loadBreakSwitch.group}</td>
                  <td className="px-3 py-2.5">{loadBreakSwitch.rating}А</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-muted">{loadBreakSwitch.phase || '—'}</td>
                  <td className="px-3 py-2.5">{loadBreakSwitch.modules}</td>
                </tr>
              )}
              {/* Вводной */}
              <tr className="bg-pink-50 dark:bg-pink-950/20">
                <td className="px-3 py-2.5">
                  <span className="rounded-md border border-pink-300 bg-pink-100 px-2 py-0.5 text-[11px] text-pink-800 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                    Ввод
                  </span>
                </td>
                <td className="px-3 py-2.5">{mainBreaker.group}</td>
                <td className="px-3 py-2.5">{mainBreaker.rating}А</td>
                <td className="px-3 py-2.5 text-[11px] text-text-muted">{mainBreaker.phase || '—'}</td>
                <td className="px-3 py-2.5">{mainBreaker.modules}</td>
              </tr>
              {/* УЗО */}
              {rcds.map(r => (
                <tr key={r.id} className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-orange-300 bg-orange-100 px-2 py-0.5 text-[11px] text-orange-800 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                      УЗО
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{r.protectedGroups.join(', ')}</td>
                  <td className="px-3 py-2.5">{r.ratingAmps}А / {r.leakageMA}мА</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-muted">{r.phase || '—'}</td>
                  <td className="px-3 py-2.5">{r.modules}</td>
                </tr>
              ))}
              {/* Дифы */}
              {diffDevices.map(d => (
                <tr key={d.id} className="bg-red-50 dark:bg-red-950/20">
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Диф
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{d.protectedGroups.join(', ')}</td>
                  <td className="px-3 py-2.5">{d.ratingAmps}А / {d.leakageMA}мА</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-muted">{d.phase || '—'}</td>
                  <td className="px-3 py-2.5">{d.modules}</td>
                </tr>
              ))}
              {/* Групповые */}
              {groupBreakers.map(b => (
                <tr key={b.id}>
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-blue-300 bg-blue-100 px-2 py-0.5 text-[11px] text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Авт
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{b.group}</td>
                  <td className="px-3 py-2.5">{b.rating}А</td>
                  <td className="px-3 py-2.5 text-[11px] text-text-muted">{b.phase || '—'}</td>
                  <td className="px-3 py-2.5">{b.modules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Подключение фаз (только для 3-фазных) */}
      {result.phaseAssignment && result.phaseAssignment.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-6">
          <h2 className="mb-4 text-lg font-semibold font-display">Распределение по фазам</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
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
                    {phaseDevices.map(a => (
                      <div key={a.deviceId} className="text-[12px] text-text-secondary">
                        {a.deviceId === 'main' ? 'Вводной' : a.deviceId === 'load_break' ? 'Рубильник' : a.deviceId}
                      </div>
                    ))}
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
  )
}
