'use client'

import { cn } from '@/lib/utils'

interface UnderConstructionProps {
  className?: string
}

export default function UnderConstruction({ className }: UnderConstructionProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-5 sm:py-4',
      className
    )}>
      <span className="text-xl sm:text-2xl shrink-0">🚧</span>
      <div>
        <p className="text-sm sm:text-base font-semibold text-amber-400">
          Раздел в разработке
        </p>
        <p className="text-xs sm:text-sm text-amber-400/70 mt-0.5">
          Мы активно работаем над этим функционалом. Скоро здесь будет полезный инструмент.
        </p>
      </div>
    </div>
  )
}
