'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Неверный email или пароль')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), email: email.toLowerCase().trim(), password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Ошибка регистрации')
      return
    }

    // Авто-логин после регистрации
    const loginResult = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (loginResult?.error) {
      setError('Аккаунт создан, но не удалось войти. Попробуйте войти вручную.')
      setMode('login')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold font-display text-accent-amber">ElectroPlan</span>
          </a>
          <p className="mt-2 text-sm text-text-muted">
            Личный кабинет электрика
          </p>
        </div>

        {/* Табы */}
        <div className="mb-6 flex rounded-lg border border-border bg-bg-elevated p-1">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-accent-amber text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-accent-amber text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          className="space-y-4 rounded-xl border border-border bg-bg-elevated p-6"
        >
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={2}
                placeholder="Иван Петров"
                className="w-full rounded-lg border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-amber/50"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ivan@example.com"
              className="w-full rounded-lg border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-amber/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
              className="w-full rounded-lg border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-amber/50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-amber px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-amber/90 disabled:opacity-50"
          >
            {loading
              ? 'Загрузка...'
              : mode === 'login'
                ? 'Войти'
                : 'Зарегистрироваться'}
          </button>

          <p className="text-center text-xs text-text-muted">
            {mode === 'login' ? (
              <>
                Нет аккаунта?{' '}
                <button type="button" onClick={() => { setMode('register'); setError('') }} className="text-accent-amber hover:underline">
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-accent-amber hover:underline">
                  Войти
                </button>
              </>
            )}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-text-muted">
          <Link href="/disclaimer" className="hover:text-text-secondary underline underline-offset-2">
            Отказ от ответственности
          </Link>
        </p>
      </div>
    </div>
  )
}
