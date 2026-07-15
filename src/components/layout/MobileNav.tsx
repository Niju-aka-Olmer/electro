'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [currentPath])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Портал в document.body — избегаем любых родительских CSS-конфликтов
  const menuContent = (
    <>
      {/* Overlay — сплошной чёрный, без блюра */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.92)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Панель меню */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-64 flex flex-col p-6 transition-transform duration-300"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: '#111318',
          borderLeft: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.7)',
        }}
      >
        <nav className="flex flex-col gap-1 mt-16">
          {links.map(link => {
            const isActive = currentPath === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-base font-semibold no-underline"
                style={{
                  color: isActive ? '#FBBF24' : '#F1F5F9',
                  backgroundColor: isActive ? 'rgba(251,191,36,0.18)' : 'transparent',
                }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>
    </>
  )

  return (
    <div className={cn('md:hidden', className)}>
      {/* Гамбургер */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg"
        aria-label="Меню"
        style={{ backgroundColor: '#1A1D24', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex flex-col gap-1.5">
          <span className={cn(
            'block h-0.5 w-5 rounded transition-all',
            open && 'translate-y-2 rotate-45'
          )}
          style={{ backgroundColor: '#94A3B8' }}
          />
          <span className={cn(
            'block h-0.5 w-5 rounded transition-all',
            open && 'opacity-0'
          )}
          style={{ backgroundColor: '#94A3B8' }}
          />
          <span className={cn(
            'block h-0.5 w-5 rounded transition-all',
            open && '-translate-y-2 -rotate-45'
          )}
          style={{ backgroundColor: '#94A3B8' }}
          />
        </div>
      </button>

      {/* Рендерим через портал — полностью вне дерева страницы */}
      {mounted && createPortal(menuContent, document.body)}
    </div>
  )
}
