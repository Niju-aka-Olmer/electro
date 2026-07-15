import type { Metadata } from 'next'
import UnderConstruction from '@/components/layout/UnderConstruction'

export const metadata: Metadata = {
  title: 'AI-консультант — ElectroPlan',
}

export default function ConsultantPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">AI-консультант</h1>
      <p className="mt-4 text-text-secondary">Чат с экспертом-электриком на базе DeepSeek.</p>
      <div className="mt-6">
        <UnderConstruction />
      </div>
      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-5 sm:p-8">
        <p className="text-text-muted">Интерфейс чата появится здесь.</p>
      </div>
    </div>
  )
}
