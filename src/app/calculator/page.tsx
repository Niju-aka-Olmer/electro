'use client'

import { useCalculatorStore } from '@/store/calculatorStore'
import CalculatorForm from '@/components/tools/calculator/CalculatorForm'
import CalculatorResults from '@/components/tools/calculator/CalculatorResults'

export default function CalculatorPage() {
  const { result, currentStep, error } = useCalculatorStore()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a href="/" className="font-display font-bold text-accent-amber">
            ← ElectroPlan
          </a>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className={currentStep >= 1 ? 'text-accent-amber' : ''}>❶ Настройки</span>
            <span>/</span>
            <span className={currentStep >= 2 ? 'text-accent-amber' : ''}>❷ Комнаты</span>
            <span>/</span>
            <span className={currentStep >= 3 ? 'text-accent-amber' : ''}>❸ Результат</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-28">
        {/* Инструкция сверху */}
        <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-5">
          <h1 className="mb-2 text-xl font-bold font-display">
            Калькулятор электроустановки
          </h1>
          <ul className="space-y-1.5 text-sm text-text-secondary leading-relaxed">
            <li>
              <strong className="text-accent-amber">1.</strong> Укажите параметры подключения
              (вводной автомат, фазы, заземление).
            </li>
            <li>
              <strong className="text-accent-amber">2.</strong> Добавьте помещения —
              для каждого укажите количество розеток, света и мощные приборы.
            </li>
            <li>
              <strong className="text-accent-amber">3.</strong> Нажмите «Рассчитать» —
              получите спецификацию: автоматы, УЗО, количество модулей в щитке.
            </li>
          </ul>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="mb-6 rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4 text-sm text-accent-danger">
            {error}
          </div>
        )}

        {/* Форма или Результат */}
        {currentStep === 3 && result ? <CalculatorResults /> : <CalculatorForm />}
      </main>
    </div>
  )
}
