'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SCHEMES } from '@/data/wiring-schemes'
import MobileNav from '@/components/layout/MobileNav'
import UnderConstruction from '@/components/layout/UnderConstruction'

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/calculator', label: 'Калькулятор' },
  { href: '/panel', label: 'Щиток' },
  { href: '/schemes', label: 'Схемы' },
  { href: '/consultant', label: 'Консультант' },
  { href: '/disclaimer', label: 'Отказ от ответственности' },
]

type WireKind = 'l' | 'n' | 'pe' | 'sw' | 'p1' | 'p2' | 'com' | 'unknown'
type RowScope = 'В коробке' | 'Между устройствами' | 'Прочее'
type WiringRow = { scope: RowScope; from: string; to: string; kind: WireKind }

function parseConnectionToRow(text: string): WiringRow {
  const raw = text.trim()
  const scope: RowScope = raw.startsWith('В коробке:') ? 'В коробке' : raw.startsWith('Между') ? 'Между устройствами' : 'Прочее'
  const normalized = raw.replace(/^В коробке:\s*/i, '').replace(/^Между\s+/i, '').trim()
  const arrow = normalized.includes('↔') ? '↔' : '→'
  const parts = normalized.split(arrow).map(p => p.trim()).filter(Boolean)
  const from = parts[0] ?? normalized
  const to = parts[1] ?? ''
  const probe = `${from} ${to}`.toUpperCase()
  const kind: WireKind =
    probe.includes('PE') ? 'pe' : probe.includes(' N') || probe.startsWith('N') ? 'n' :
    probe.includes('SW') || probe.includes('УПР') ? 'sw' : probe.includes('P1') ? 'p1' :
    probe.includes('P2') ? 'p2' : probe.includes('COM') ? 'com' :
    probe.includes(' L') || probe.startsWith('L') ? 'l' : 'unknown'
  return { scope, from, to: to || (arrow === '↔' ? from : ''), kind }
}

function wireLabel(kind: WireKind) {
  if (kind === 'l') return 'L'; if (kind === 'n') return 'N'; if (kind === 'pe') return 'PE'
  if (kind === 'sw') return 'SW'; if (kind === 'p1') return 'P1'; if (kind === 'p2') return 'P2'
  if (kind === 'com') return 'COM'; return '?'
}

function wireColor(kind: WireKind) {
  if (kind === 'l') return '#EF4444'; if (kind === 'n') return '#60A5FA'; if (kind === 'pe') return '#86EFAC'
  if (kind === 'sw' || kind === 'p1' || kind === 'p2') return '#C084FC'; return '#FBBF24'
}

export default function SchemesPage() {
  const [activeScheme, setActiveScheme] = useState<string>(SCHEMES[0].id)
  const [showHelp, setShowHelp] = useState(true)

  const active = SCHEMES.find(s => s.id === activeScheme) ?? SCHEMES[0]
  const rows = active.connections.map(parseConnectionToRow)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a href="/" className="font-display font-bold text-accent-amber">← ElectroPlan</a>
          <MobileNav links={navLinks} currentPath="/schemes" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8 pb-20">
        <div className="mb-6 sm:mb-8 rounded-xl border border-border bg-bg-elevated p-4 sm:p-5">
          <h1 className="mb-2 text-lg sm:text-xl font-bold font-display">Схемы расключения</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Реальные схемы расключения выключателей. Цветная маркировка жил (L — фаза, N — ноль, PE — земля, SW — управляющий).
            Все схемы соответствуют ПУЭ-7 и ГОСТ Р 50571.
          </p>
        </div>

        <UnderConstruction className="mb-6" />

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
        <div className="rounded-xl border border-border bg-bg-elevated p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-display">{active.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{active.description}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-amber/10 px-2 py-0.5 text-[11px] text-accent-amber">
              {active.category}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span>Кабель: {active.cableInfo}</span>
            <span>Устройства: {active.devices}</span>
            <button
              onClick={() => setShowHelp(v => !v)}
              className={cn(
                'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                showHelp ? 'border-accent-amber bg-accent-amber/10 text-accent-amber' : 'border-border text-text-secondary hover:border-border-accent'
              )}
            >
              {showHelp ? 'Скрыть подсказки' : 'Показать подсказки'}
            </button>
          </div>

          {/* Картинка схемы */}
          {active.imageUrl ? (
            <div className="mb-6 overflow-hidden rounded-lg border border-border bg-white">
              <img
                src={active.imageUrl}
                alt={active.title}
                className="w-full h-auto max-h-[500px] object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center rounded-lg border border-dashed border-border bg-bg-base py-16">
              <p className="text-sm text-text-muted">Изображение схемы готовится</p>
            </div>
          )}

          {/* Таблица соединений */}
          <div className="rounded-lg bg-bg-base p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">Порядок расключения в распредкоробке</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[120px_1fr_1fr_60px] bg-bg-surface px-3 py-2 text-[11px] font-semibold text-text-secondary">
                <div>Где</div>
                <div>Откуда</div>
                <div>Куда</div>
                <div className="text-right">Жила</div>
              </div>
              <div className="divide-y divide-border">
                {rows.map((r: WiringRow, idx: number) => (
                  <div key={idx} className="grid grid-cols-[120px_1fr_1fr_60px] px-3 py-2 text-[13px] gap-2 items-center hover:bg-bg-surface/50 transition-colors">
                    <div className="text-text-secondary text-xs">{r.scope}</div>
                    <div className="min-w-0 truncate">{r.from}</div>
                    <div className="min-w-0 truncate">{r.to || '—'}</div>
                    <div className="flex justify-end">
                      <span
                        className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ borderColor: wireColor(r.kind), color: wireColor(r.kind) }}
                      >
                        {wireLabel(r.kind)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Как читать схему</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              L — фаза (коричневый), N — ноль (синий), PE — земля (жёлто-зелёный),
              SW — управляющий провод (фиолетовый).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Безопасность</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Все работы проводить при отключённом напряжении. Монтаж — только с допуском III группы.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">Сечения</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Освещение: 1.5 мм² · Розетки: 2.5 мм² · Варочная: 6 мм²
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
