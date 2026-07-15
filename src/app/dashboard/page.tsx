'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CalcItem {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [calcs, setCalcs] = useState<CalcItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const fetchCalcs = useCallback(async () => {
    try {
      const res = await fetch('/api/calculations')
      if (res.ok) {
        const data = await res.json()
        setCalcs(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchCalcs()
    }
  }, [status, router, fetchCalcs])

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот расчёт?')) return
    const res = await fetch('/api/calculations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setCalcs(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleRename = async (id: string) => {
    if (!editName.trim()) return
    const res = await fetch('/api/calculations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim() }),
    })
    if (res.ok) {
      setCalcs(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c))
    }
    setEditingId(null)
  }

  const startEdit = (calc: CalcItem) => {
    setEditingId(calc.id)
    setEditName(calc.name)
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (status === 'loading') return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Мои расчёты</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/calculator"
            className="rounded-lg bg-accent-amber px-4 py-2 text-sm font-semibold text-white hover:bg-accent-amber/90 transition-colors"
          >
            + Новый расчёт
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center text-text-muted">
          Загрузка...
        </div>
      ) : calcs.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center">
          <p className="text-text-muted mb-4">У вас пока нет сохранённых расчётов</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-amber/90 transition-colors"
          >
            Выполнить первый расчёт →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {calcs.map(calc => (
            <div
              key={calc.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-bg-elevated px-4 py-3 sm:px-5"
            >
              {/* Название */}
              <div className="flex-1 min-w-0">
                {editingId === calc.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(calc.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleRename(calc.id)}
                    autoFocus
                    className="w-full rounded-md border border-accent-amber/50 bg-bg-base px-3 py-1.5 text-sm text-text-primary outline-none"
                  />
                ) : (
                  <>
                    <Link
                      href={`/calculator?load=${calc.id}`}
                      className="text-sm font-semibold text-text-primary hover:text-accent-amber transition-colors"
                    >
                      {calc.name}
                    </Link>
                    <p className="text-xs text-text-muted mt-0.5">{formatDate(calc.updatedAt)}</p>
                  </>
                )}
              </div>

              {/* Действия */}
              <div className="flex items-center gap-1.5 shrink-0">
                {editingId !== calc.id && (
                  <>
                    <button
                      onClick={() => startEdit(calc)}
                      title="Переименовать"
                      className="rounded-md p-2 text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(calc.id)}
                      title="Удалить"
                      className="rounded-md p-2 text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
