'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const SCHEMES = [
  {
    id: 'pass-through-2',
    title: 'Проходной выключатель — 2 точки',
    description: 'Управление освещением из двух мест: начало и конец коридора, спальня-вход.',
    rules: 'ПУЭ 6.1.23, 7.1.26',
    svg: (color: string) => (
      <svg viewBox="0 0 400 200" className="w-full h-48" fill="none" stroke={color} strokeWidth="2">
        {/* Линия L (фаза) */}
        <path d="M20 40 L380 40" className="opacity-40" strokeWidth="1" />
        <text x="10" y="36" fontSize="11" fill={color} className="opacity-40">L</text>

        {/* Переключатели */}
        {/* Switch 1 */}
        <rect x="60" y="60" width="50" height="80" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="85" y="108" textAnchor="middle" fontSize="10" fill={color}>S1</text>

        {/* Switch 2 */}
        <rect x="290" y="60" width="50" height="80" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="315" y="108" textAnchor="middle" fontSize="10" fill={color}>S2</text>

        {/* Коммутация S1 */}
        <line x1="110" y1="80" x2="160" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="110" y1="120" x2="160" y2="120" stroke={color} strokeWidth="1.5" />
        <line x1="110" y1="100" x2="160" y2="100" stroke={color} strokeWidth="1" strokeDasharray="3,3" />

        {/* Параллельные линии между S1 и S2 */}
        <line x1="160" y1="80" x2="240" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="160" y1="120" x2="240" y2="120" stroke={color} strokeWidth="1.5" />

        {/* Коммутация S2 */}
        <line x1="240" y1="80" x2="290" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="240" y1="120" x2="290" y2="120" stroke={color} strokeWidth="1.5" />

        {/* Нагрузка — лампа */}
        <circle cx="365" cy="100" r="14" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="355" y1="100" x2="375" y2="100" stroke={color} strokeWidth="1" />
        <line x1="365" y1="90" x2="365" y2="110" stroke={color} strokeWidth="1" />
        <circle cx="365" cy="100" r="3" fill={color} />

        {/* N */}
        <line x1="365" y1="114" x2="365" y2="180" stroke={color} strokeWidth="1" className="opacity-40" />
        <text x="365" y="188" textAnchor="middle" fontSize="11" fill={color} className="opacity-40">N</text>

        {/* Подписи */}
        <text x="40" y="188" fontSize="11" fill={color} className="opacity-50">Фаза → S1 → S2 → Лампа → N</text>
        <text x="40" y="16" fontSize="10" fill={color} className="opacity-40">220В 50Гц</text>
      </svg>
    ),
  },
  {
    id: 'pass-through-3',
    title: 'Проходной выключатель — 3 точки',
    description: 'Управление из трёх мест: длинный коридор, лестница, большая спальня.',
    rules: 'ПУЭ 6.1.23',
    svg: (color: string) => (
      <svg viewBox="0 0 500 200" className="w-full h-48" fill="none" stroke={color} strokeWidth="2">
        {/* Фаза */}
        <path d="M20 40 L480 40" className="opacity-40" strokeWidth="1" />
        <text x="10" y="36" fontSize="11" fill={color} className="opacity-40">L</text>

        {/* S1 */}
        <rect x="40" y="60" width="50" height="80" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="65" y="108" textAnchor="middle" fontSize="10" fill={color}>S1</text>

        {/* S2 (перекрёстный) */}
        <rect x="225" y="60" width="60" height="80" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="255" y="108" textAnchor="middle" fontSize="10" fill={color}>S2✕</text>

        {/* S3 */}
        <rect x="400" y="60" width="50" height="80" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="425" y="108" textAnchor="middle" fontSize="10" fill={color}>S3</text>

        {/* Линии */}
        <line x1="90" y1="80" x2="225" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="90" y1="120" x2="225" y2="120" stroke={color} strokeWidth="1.5" />
        <line x1="285" y1="80" x2="400" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="285" y1="120" x2="400" y2="120" stroke={color} strokeWidth="1.5" />

        {/* X-соединение в S2 */}
        <line x1="235" y1="80" x2="275" y2="120" stroke={color} strokeWidth="1" strokeDasharray="3,3" />
        <line x1="235" y1="120" x2="275" y2="80" stroke={color} strokeWidth="1" strokeDasharray="3,3" />
        <circle cx="255" cy="100" r="3" fill={color} />

        {/* Лампа */}
        <circle cx="460" cy="100" r="14" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="450" y1="100" x2="470" y2="100" stroke={color} strokeWidth="1" />
        <line x1="460" y1="90" x2="460" y2="110" stroke={color} strokeWidth="1" />
        <circle cx="460" cy="100" r="3" fill={color} />

        <line x1="460" y1="114" x2="460" y2="180" stroke={color} strokeWidth="1" className="opacity-40" />
        <text x="460" y="188" textAnchor="middle" fontSize="11" fill={color} className="opacity-40">N</text>
      </svg>
    ),
  },
  {
    id: 'junction-box',
    title: 'Распределительная коробка',
    description: 'Стандартное расключение: кабель от щитка → коробка → выключатель → лампа.',
    rules: 'ПУЭ 7.1.27, 7.1.28',
    svg: (color: string) => (
      <svg viewBox="0 0 400 260" className="w-full h-56" fill="none" stroke={color} strokeWidth="2">
        {/* Коробка */}
        <rect x="150" y="75" width="80" height="70" rx="8" stroke={color} strokeWidth="2" fill="none" />
        <text x="190" y="116" textAnchor="middle" fontSize="12" fill={color}>Коробка</text>

        {/* Кабель от щитка */}
        <path d="M190 145 L190 210" stroke={color} strokeWidth="1.5" />
        <text x="190" y="225" textAnchor="middle" fontSize="11" fill={color} className="opacity-50">от щитка (L+N+PE)</text>
        <circle cx="190" cy="145" r="3" fill={color} />

        {/* К выключателю */}
        <path d="M150 100 L60 100" stroke={color} strokeWidth="1.5" />
        <text x="105" y="94" textAnchor="middle" fontSize="10" fill={color} className="opacity-50">L</text>
        <rect x="10" y="75" width="40" height="50" rx="6" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="30" y="106" textAnchor="middle" fontSize="10" fill={color}>S</text>
        <path d="M50 100 L60 100" stroke={color} strokeWidth="1.5" />
        <circle cx="150" cy="100" r="3" fill={color} />

        {/* К лампе */}
        <path d="M230 100 L310 100" stroke={color} strokeWidth="1.5" />
        <circle cx="230" cy="100" r="3" fill={color} />
        <path d="M310 75 L310 125" stroke={color} strokeWidth="1.5" className="opacity-40" />
        <text x="310" y="95" textAnchor="middle" fontSize="10" fill={color} className="opacity-40">N</text>
        <circle cx="340" cy="100" r="16" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="328" y1="100" x2="352" y2="100" stroke={color} strokeWidth="1" />
        <line x1="340" y1="88" x2="340" y2="112" stroke={color} strokeWidth="1" />
        <circle cx="340" cy="100" r="3" fill={color} />

        {/* Цветная маркировка жил */}
        <text x="20" y="260" fontSize="10" fill={color} className="opacity-40">
          PE — жёлто-зелёный · N — синий · L (фаза) — коричневый/чёрный
        </text>
      </svg>
    ),
  },
  {
    id: 'panel-single',
    title: 'Сборка щитка (1-фазный)',
    description: 'Раскладка модулей: вводной → УЗО → групповые автоматы.',
    rules: 'ГОСТ Р 51778-2001, ПУЭ 7.1.30',
    svg: (color: string) => (
      <svg viewBox="0 0 400 280" className="w-full h-56" fill="none" stroke={color} strokeWidth="2">
        {/* DIN-рейки */}
        <rect x="30" y="20" width="340" height="60" rx="6" stroke={color} strokeWidth="1.5" fill="none" className="opacity-30" />
        <rect x="30" y="100" width="340" height="60" rx="6" stroke={color} strokeWidth="1.5" fill="none" className="opacity-30" />
        <rect x="30" y="180" width="340" height="60" rx="6" stroke={color} strokeWidth="1.5" fill="none" className="opacity-30" />

        {/* Ряд 1: Вводной + УЗО */}
        <text x="20" y="15" fontSize="9" fill={color} className="opacity-40">Ряд 1</text>
        <rect x="40" y="32" width="55" height="36" rx="4" stroke={color} strokeWidth="2" fill="none" />
        <text x="67" y="54" textAnchor="middle" fontSize="10" fill={color} className="font-bold">ВА</text>
        <rect x="105" y="32" width="80" height="36" rx="4" stroke={color} strokeWidth="1.5" fill="none" className="opacity-70" />
        <text x="145" y="48" textAnchor="middle" fontSize="9" fill={color} className="opacity-70">УЗО 25А</text>
        <text x="145" y="60" textAnchor="middle" fontSize="8" fill={color} className="opacity-50">30мА</text>

        {/* Ряд 2: Групповые */}
        <text x="20" y="95" fontSize="9" fill={color} className="opacity-40">Ряд 2</text>
        {['C16', 'C16', 'C16', 'C10', 'C10', 'B6'].map((label, i) => (
          <rect key={i} x={40 + i * 54} y="112" width="48" height="36" rx="4" stroke={color} strokeWidth="1" fill="none" className="opacity-60" />
        ))}
        {['C16', 'C16', 'C16', 'C10', 'C10', 'B6'].map((label, i) => (
          <text key={i} x={64 + i * 54} y="132" textAnchor="middle" fontSize="9" fill={color} className="opacity-60">{label}</text>
        ))}

        {/* Ряд 3: ещё автоматы */}
        <text x="20" y="175" fontSize="9" fill={color} className="opacity-40">Ряд 3</text>
        {['C16', 'C16', 'C25', 'C25', 'Диф'].map((label, i) => (
          <rect key={i} x={40 + i * 60} y="192" width="52" height="36" rx="4" stroke={color} strokeWidth="1" fill="none" className="opacity-50" />
        ))}
        {['C16', 'C16', 'C25', 'C25', 'Диф'].map((label, i) => (
          <text key={i} x={66 + i * 60} y="212" textAnchor="middle" fontSize="9" fill={color} className="opacity-50">{label}</text>
        ))}

        <text x="40" y="268" fontSize="9" fill={color} className="opacity-40">Всего: 17 модулей · Щиток на 18-24 модуля</text>
      </svg>
    ),
  },
]

const COLORS = ['#f59e0b', '#eab308', '#d97706']

export default function SchemesPage() {
  const [activeScheme, setActiveScheme] = useState<string>(SCHEMES[0].id)

  const active = SCHEMES.find(s => s.id === activeScheme) ?? SCHEMES[0]
  const colorIdx = SCHEMES.findIndex(s => s.id === activeScheme) % COLORS.length

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
            Принципиальные схемы подключения. Нажмите на схему для детального просмотра.
            Все схемы соответствуют ПУЭ-7 и ГОСТ Р 50571.
          </p>
        </div>

        {/* Выбор схемы */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SCHEMES.map(s => (
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

        {/* Активная схема */}
        <div className="rounded-xl border border-border bg-bg-elevated p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-display">{active.title}</h2>
            <p className="mt-1 text-sm text-text-secondary">{active.description}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent-amber/10 px-2 py-0.5 text-[11px] text-accent-amber">
              {active.rules}
            </div>
          </div>

          <div className="rounded-lg bg-bg-base p-4">
            {active.svg(COLORS[colorIdx])}
          </div>
        </div>

        {/* Пояснения */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <div className="mb-1 text-lg">🔍</div>
            <h3 className="mb-1 text-sm font-semibold">Как читать схему</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              L — фаза (коричневый/чёрный), N — ноль (синий), PE — заземление (жёлто-зелёный).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <div className="mb-1 text-lg">⚡</div>
            <h3 className="mb-1 text-sm font-semibold">Безопасность</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Все работы проводить при отключённом напряжении.
              Монтаж — только с допуском III группы.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <div className="mb-1 text-lg">📐</div>
            <h3 className="mb-1 text-sm font-semibold">Сечения</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Освещение: 1.5мм² · Розетки: 2.5мм² · Варочная: 6мм²
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
