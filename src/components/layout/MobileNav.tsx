'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [currentPath])

  // iOS Safari fix: блокируем скролл через position:fixed на body
  useEffect(() => {
    if (!mounted) return
    if (open) {
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [open, mounted])

  if (!mounted) {
    return (
      <div className={cn('md:hidden', className)}>
        <button className="h-10 w-10 rounded-lg" aria-label="Меню" style={{ background: '#1A1D24', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>
    )
  }

  return (
    <div className={cn('md:hidden', className)}>
      {/* Гамбургер */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-[60] flex h-10 w-10 items-center justify-center rounded-lg"
        aria-label="Меню"
        style={{ background: '#1A1D24', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex flex-col gap-1.5">
          <span className={cn('block h-0.5 w-5 rounded transition-all', open && 'translate-y-2 rotate-45')} style={{ background: '#94A3B8' }} />
          <span className={cn('block h-0.5 w-5 rounded transition-all', open && 'opacity-0')} style={{ background: '#94A3B8' }} />
          <span className={cn('block h-0.5 w-5 rounded transition-all', open && '-translate-y-2 -rotate-45')} style={{ background: '#94A3B8' }} />
        </div>
      </button>

      {/* Меню и overlay — рендерим в body */}
      {open && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000000',
              opacity: 0.92,
            }}
          />
          {/* Панель */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 256,
              background: '#111318',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.7)',
              padding: '80px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map(link => {
                const isActive = currentPath === link.href
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: isActive ? '#FBBF24' : '#F1F5F9',
                      background: isActive ? 'rgba(251,191,36,0.18)' : 'transparent',
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {link.label}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
