'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SCHEMES } from '@/data/wiring-schemes'

export default function SchemesPage() {
  const [activeScheme, setActiveScheme] = useState<string>(SCHEMES[0].id)

  const active = SCHEMES.find(s => s.id === activeScheme) ?? SCHEMES[0]
  const SvgComponent = active.Svg

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

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-text-muted">
            <span>🔌 Кабель: {active.cableInfo}</span>
            <span>📦 {active.devices}</span>
          </div>

          <div className="rounded-lg bg-bg-base p-4">
            <SvgComponent />
          </div>
        </div>

        {/* Пояснения */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">🔍 Как читать схему</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              L — фаза (коричневый), N — ноль (синий), PE — заземление (жёлто-зелёный),
              L(упр) — управляющий провод (фиолетовый).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">⚡ Безопасность</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Все работы проводить при отключённом напряжении.
              Монтаж — только с допуском III группы.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h3 className="mb-2 text-sm font-semibold">📐 Сечения</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Освещение: 1.5мм² · Розетки: 2.5мм² · Варочная: 6мм²
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
