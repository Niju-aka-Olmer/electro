'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserRow {
  id: string
  username: string
  email: string
  createdAt: string
  calculationsCount: number
}

interface AdminStats {
  totalUsers: number
  totalCalcs: number
  recentUsers: UserRow[]
}

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)

  // Проверяем — есть ли уже admin-сессия
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setAuthenticated(true)
        }
      } catch {}
      setChecked(true)
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loginRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          csrfToken: await getCsrf(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      // fallback: signIn
      const { signIn } = await import('next-auth/react')
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Неверный логин или пароль. Или у вас нет прав администратора.')
        setLoading(false)
        return
      }

      // Проверяем доступ к статистике
      const statsRes = await fetch('/api/admin/stats')
      if (!statsRes.ok) {
        setError('У вас нет прав администратора.')
        setLoading(false)
        return
      }

      const data = await statsRes.json()
      setStats(data)
      setAuthenticated(true)
    } catch {
      setError('Ошибка подключения')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setAuthenticated(false)
    setStats(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  if (!checked) return null

  // Экран входа
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="text-2xl font-bold font-display text-accent-amber">ElectroPlan</span>
            <p className="mt-2 text-sm text-text-muted">Панель администратора</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-amber/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-amber/50"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent-amber px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-amber/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="mt-4 text-center">
            <a href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">← На главную</a>
          </p>
        </div>
      </div>
    )
  }

  // Дашборд
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Админ-панель</h1>
          <p className="mt-1 text-sm text-text-secondary">Управление пользователями и статистика</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
        >
          Выйти
        </button>
      </div>

      {/* Карточки статистики */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-elevated p-6">
          <p className="text-sm text-text-muted">Всего пользователей</p>
          <p className="mt-1 text-3xl font-bold font-display text-accent-amber">{stats?.totalUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elevated p-6">
          <p className="text-sm text-text-muted">Всего расчётов</p>
          <p className="mt-1 text-3xl font-bold font-display text-accent-amber">{stats?.totalCalcs ?? 0}</p>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Последние пользователи</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted bg-bg-surface">
                <th className="px-5 py-3">Пользователь</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Расчётов</th>
                <th className="px-5 py-3">Зарегистрирован</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.recentUsers.map(u => (
                <tr key={u.id} className="hover:bg-bg-surface/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-text-primary">{u.username}</td>
                  <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-3">{u.calculationsCount}</td>
                  <td className="px-5 py-3 text-text-muted text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-8 text-center">
        <a href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">← На главную</a>
      </p>
    </div>
  )
}

async function getCsrf() {
  const res = await fetch('/api/auth/csrf')
  const data = await res.json()
  return data.csrfToken
}
