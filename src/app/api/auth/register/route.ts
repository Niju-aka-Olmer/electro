import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedUsername = username.trim()

    if (normalizedUsername.length < 2) {
      return NextResponse.json({ error: 'Имя пользователя должно быть не менее 2 символов' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 })
    }

    // Проверка уникальности
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    })

    if (existing) {
      const field = existing.email === normalizedEmail ? 'Email' : 'Имя пользователя'
      return NextResponse.json({ error: `${field} уже занят` }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
      },
    })

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
