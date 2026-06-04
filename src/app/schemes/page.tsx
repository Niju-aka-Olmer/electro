'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SCHEMES } from '@/data/wiring-schemes'

type RowScope = 'В коробке' | 'Между устройствами' | 'Прочее'
type WireKind = 'l' | 'n' | 'pe' | 'sw' | 'p1' | 'p2' | 'com' | 'unknown'
type WiringRow = { scope: RowScope; from: string; to: string; kind: WireKind }

function parseConnectionToRow(text: string): WiringRow {
  const raw = text.trim()

  const scope: RowScope =
    raw.startsWith('В коробке:') ? 'В коробке' :
    raw.startsWith('Между') ? 'Между устройствами' :
    'Прочее'

  const normalized = raw
    .replace(/^В коробке:\s*/i, '')
    .replace(/^Между\s+/i, '')
    .trim()

  const arrow = normalized.includes('↔') ? '↔' : '→'
  const parts = normalized.split(arrow).map(p => p.trim()).filter(Boolean)
  const from = parts[0] ?? normalized
  const to = parts[1] ?? ''

  const probe = `${from} ${to}`.toUpperCase()
  const kind: WireKind =
    probe.includes('PE') ? 'pe' :
    probe.includes(' N') || probe.startsWith('N') ? 'n' :
    probe.includes('SW') || probe.includes('УПР') ? 'sw' :
    probe.includes('P1') ? 'p1' :
    probe.includes('P2') ? 'p2' :
    probe.includes('COM') ? 'com' :
    probe.includes(' L') || probe.startsWith('L') ? 'l' :
    'unknown'

  return { scope, from, to: to || (arrow === '↔' ? from : ''), kind }
}

function wireLabel(kind: WireKind) {
  if (kind === 'l') return 'L'
  if (kind === 'n') return 'N'
  if (kind === 'pe') return 'PE'
  if (kind === 'sw') return 'SW'
  if (kind === 'p1') return 'P1'
  if (kind === 'p2') return 'P2'
  if (kind === 'com') return 'COM'
  return '?'
}

function wireColor(kind: WireKind) {
  if (kind === 'l') return 'var(--wire-l)'
  if (kind === 'n') return 'var(--wire-n)'
  if (kind === 'pe') return 'var(--wire-pe)'
  if (kind === 'sw' || kind === 'p1' || kind === 'p2') return 'var(--wire-sw)'
  return 'var(--border-accent)'
}

function splitDevices(devices: string) {
  const parts = devices.split(',').map(s => s.trim()).filter(Boolean)
  const left: string[] = []
  const right: string[] = []
  const other: string[] = []

  for (const p of parts) {
    const low = p.toLowerCase()
    if (/(выключ|диммер|датчик|кнопк|реле|фотореле)/i.test(low)) left.push(p)
    else if (/(ламп|люстр)/i.test(low)) right.push(p)
    else other.push(p)
  }

  return { left, right, other }
}

export default function SchemesPage() {
  const [activeScheme, setActiveScheme] = useState<string>(SCHEMES[0].id)
  const [showHelp, setShowHelp] = useState(true)
  const [view, setView] = useState<'table' | 'svg'>('table')

  const active = SCHEMES.find(s => s.id === activeScheme) ?? SCHEMES[0]
  const SvgComponent = active.Svg
  const { left, right } = splitDevices(active.devices)
  const rows = active.connections.map(parseConnectionToRow)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a href="/" className="font-display font-bold text-accent-amber">← ElectroPlan</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-20">
        <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-5">
          <h1 className="mb-2 text-xl font-bold font-display">Схемы расключения</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Реальные схемы расключения выключателей. Показана распредкоробка с соединениями Wago,
            цветная маркировка жил (L/N/PE/управляющий). Все схемы соответствуют ПУЭ-7 и ГОСТ Р 50571.
          </p>
        </div>

        {/* Категории */}
        {['Обычные', 'Проходные', 'Специальные', 'Автоматика', 'Комбинированные'].map(cat => {
          const schemes = SCHEMES.filter(s => s.category === cat)
          if (schemes.length === 0) return null
          return (
            <div key={cat} className="mb-6">
              <h2 className="mb-3 text-sm font-bold font-display text-text-secondary uppercase tracking-wider">{cat}</h2>
              <div className="flex flex-wrap gap-2">
                {schemes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScheme(s.id)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-xs font-medium transition-all',
                      activeScheme === s.id
                        ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-border-accent'
                    )}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Активная схема */}
        <div className="rounded-xl border border-border bg-bg-elevated p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-display">{active.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{active.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-amber/10 px-2 py-0.5 text-[11px] text-accent-amber">
                {active.category}
              </span>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex flex-wrap gap-4">
              <span>Кабель: {active.cableInfo}</span>
              <span>Устройства: {active.devices}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                <button
                  onClick={() => setView('table')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium transition-colors',
                    view === 'table' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-bg-elevated text-text-secondary'
                  )}
                >
                  Таблица
                </button>
                <button
                  onClick={() => setView('svg')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium transition-colors',
                    view === 'svg' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-bg-elevated text-text-secondary'
                  )}
                >
                  Картинка
                </button>
              </div>
              <button
                onClick={() => setShowHelp(v => !v)}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  showHelp
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-border bg-bg-elevated text-text-secondary hover:border-border-accent'
                )}
              >
                {showHelp ? 'Скрыть подсказки' : 'Показать подсказки'}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-bg-base p-4">
            {view === 'svg' ? (
              <SvgComponent />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                  <div className="rounded-lg border border-border bg-bg-elevated p-3">
                    <div className="text-xs font-semibold text-text-secondary">Выключатели / управление</div>
                    <div className="mt-1 space-y-1 text-xs text-text-muted">
                      {(left.length ? left : ['—']).map((s, idx) => (
                        <div key={idx}>{s}</div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden items-center justify-center md:flex">
                    <div className="text-sm text-text-muted">→</div>
                  </div>
                  <div className="rounded-lg border border-border bg-bg-elevated p-3">
                    <div className="text-xs font-semibold text-text-secondary">Распредкоробка</div>
                    <div className="mt-1 text-xs text-text-muted">Соединения / клеммы (Wago)</div>
                  </div>
                  <div className="hidden items-center justify-center md:flex">
                    <div className="text-sm text-text-muted">→</div>
                  </div>
                  <div className="rounded-lg border border-border bg-bg-elevated p-3">
                    <div className="text-xs font-semibold text-text-secondary">Лампы / нагрузка</div>
                    <div className="mt-1 space-y-1 text-xs text-text-muted">
                      {(right.length ? right : ['—']).map((s, idx) => (
                        <div key={idx}>{s}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-[160px_1fr_1fr_80px] bg-bg-elevated px-3 py-2 text-[11px] font-semibold text-text-secondary">
                    <div>Где</div>
                    <div>Откуда</div>
                    <div>Куда</div>
                    <div className="text-right">Жила</div>
                  </div>
                  <div className="divide-y divide-border">
                    {rows.map((r: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-[160px_1fr_1fr_80px] px-3 py-2 text-[13px] gap-2 items-center hover:bg-muted/30 transition-colors">
                        <div className="text-text-secondary">{r.scope}</div>
                        <div className="min-w-0 truncate">{r.from}</div>
                        <div className="min-w-0 truncate">{r.to || '—'}</div>
                        <div className="flex justify-end">
                          <span
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                            style={{ borderColor: wireColor(r.kind), color: wireColor(r.kind), backgroundColor: 'rgba(255,255,255,0.02)' }}
                          >
                            {wireLabel(r.kind)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showHelp && (
            <div className="mt-5 rounded-lg border border-border bg-bg-base p-4">
              <h3 className="mb-2 text-sm font-semibold text-text-secondary">Как собрать в распредкоробке</h3>
              <ul className="space-y-1 text-xs text-text-muted">
                {active.connections.map((item: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[2px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Пояснения */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Как читать схему</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              L — фаза (коричневый), N — ноль (синий), PE — заземление (жёлто-зелёный),
              L(упр) — управляющий провод (фиолетовый).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Безопасность</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Все работы проводить при отключённом напряжении.
              Монтаж — только с допуском III группы.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Сечения</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Освещение: 1.5мм² · Розетки: 2.5мм² · Варочная: 6мм²
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
