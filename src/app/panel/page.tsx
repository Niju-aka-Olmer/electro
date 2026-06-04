import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Расчёт щитка — ElectroPlan',
}

export default function PanelPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold font-display">Расчёт щитка</h1>
      <p className="mt-4 text-text-secondary">Компоновка DIN-рейки и подбор корпуса.</p>
      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-8">
        <p className="text-text-muted">Конфигуратор щитка появится здесь.</p>
      </div>
    </div>
  )
}
