'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import MobileNav from '@/components/layout/MobileNav'

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/calculator', label: 'Калькулятор' },
  { href: '/panel', label: 'Щиток' },
  { href: '/schemes', label: 'Схемы' },
  { href: '/consultant', label: 'Консультант' },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-border',
          'bg-bg-base/80 backdrop-blur-lg',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold font-display text-accent-amber">
              ElectroPlan
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary hover:text-accent-amber transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <MobileNav links={navLinks} currentPath="/" />
        </div>
      </header>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-50"
        />
        <div className="pointer-events-none absolute inset-0 bg-amber-glow opacity-30" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-20 pb-16 sm:pt-32 sm:pb-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs text-text-muted">
            ⚡ Инженерный инструмент для электромонтажа
          </div>

          <h1 className="max-w-3xl text-3xl sm:text-5xl md:text-6xl font-bold font-display leading-tight tracking-tight">
            Расчёт{' '}
            <span className="text-accent-amber">электроустановок</span>
            <br />
            по ПУЭ и ГОСТ
          </h1>

          <p className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg text-text-secondary">
            Профессиональный подбор автоматов, УЗО, дифавтоматов,
            компоновка щитков и схемы расключения — для жилых помещений РФ и СНГ.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/calculator"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-amber px-6 py-3 font-semibold text-bg-base transition-all hover:shadow-amber"
            >
              Начать расчёт →
            </a>
            <a
              href="/schemes"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-6 py-3 font-semibold text-text-primary transition-all hover:border-accent-amber"
            >
              Смотреть схемы
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="border-t border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="mb-10 sm:mb-16 text-center text-2xl sm:text-3xl font-bold font-display">
            Возможности
          </h2>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className={cn(
                  'group rounded-xl border border-border bg-bg-elevated p-6',
                  'transition-all hover:border-accent-amber/50 hover:shadow-card',
                  mounted && 'animate-fade-in-up',
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold font-display text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="mt-auto border-t border-border bg-bg-base py-8 text-center text-sm text-text-muted">
        <p>ElectroPlan — инструмент для проектирования электроустановок</p>
        <p className="mt-1">
          Расчёты носят справочный характер. Всегда сверяйтесь с актуальными нормативами.
        </p>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: '🔌',
    title: 'Автоматы и УЗО',
    description:
      'Расчёт номиналов автоматов, УЗО и дифавтоматов по нагрузке. Характеристики B/C/D, токи утечки, селективность.',
  },
  {
    icon: '📦',
    title: 'Компоновка щитка',
    description:
      'Подсчёт модулей на DIN-рейку, выбор корпуса, раскладка оборудования по группам.',
  },
  {
    icon: '🗺️',
    title: 'Схемы расключения',
    description:
      'Интерактивные SVG-схемы: проходные выключатели, распределительные коробки, сборка щитков.',
  },
  {
    icon: '💬',
    title: 'AI-консультант',
    description:
      'Чат с DeepSeek AI в роли инженера-электрика. Отвечает по ПУЭ-7, ГОСТ Р 50571, СП 256.',
  },
]
