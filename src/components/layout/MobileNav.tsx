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
          'fixed inset-0 z-40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      />

      {/* Панель меню */}
      <div
        className={cn(
          'fixed top-0 right-0 z-40 h-full w-64 flex flex-col p-6 pt-20 transition-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          background: '#111318',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
        }}
      >
        <nav className="flex flex-col gap-3">
          {links.map(link => {
            const isActive = currentPath === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-base font-semibold transition-all"
                style={{
                  color: isActive ? '#FBBF24' : '#F1F5F9',
                  background: isActive ? 'rgba(251,191,36,0.15)' : 'transparent',
                }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
