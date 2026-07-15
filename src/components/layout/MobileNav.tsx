'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

interface MobileNavProps {
  links: NavLink[]
  currentPath?: string
  className?: string
}

export default function MobileNav({ links, currentPath = '/', className }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  // Закрывать при навигации
  useEffect(() => {
    setOpen(false)
  }, [currentPath])

  // Блокировать скролл body при открытии
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className={cn('md:hidden', className)}>
      {/* Гамбургер */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated"
        aria-label="Меню"
      >
        <div className="flex flex-col gap-1">
          <span className={cn(
            'block h-0.5 w-4 rounded bg-text-secondary transition-all',
            open && 'translate-y-1.5 rotate-45'
          )} />
          <span className={cn(
            'block h-0.5 w-4 rounded bg-text-secondary transition-all',
            open && 'opacity-0'
          )} />
          <span className={cn(
            'block h-0.5 w-4 rounded bg-text-secondary transition-all',
            open && '-translate-y-1.5 -rotate-45'
          )} />
        </div>
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/90 backdrop-blur-md transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Панель меню */}
      <div className={cn(
        'fixed top-0 right-0 z-40 h-full w-64 bg-[#111318] border-l border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl',
        'flex flex-col p-6 pt-20 transition-transform',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <nav className="flex flex-col gap-3">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-4 py-2.5 text-base font-semibold transition-all',
                currentPath === link.href
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white hover:bg-white/10 hover:text-amber-400'
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
