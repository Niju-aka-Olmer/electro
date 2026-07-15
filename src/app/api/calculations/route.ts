import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — список всех расчётов пользователя
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const calculations = await prisma.savedCalculation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(calculations)
}

// POST — сохранить новый расчёт
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, data } = await req.json()
  if (!name || !data) {
    return NextResponse.json({ error: 'name and data are required' }, { status: 400 })
  }

  const calc = await prisma.savedCalculation.create({
    data: {
      name: String(name).slice(0, 200),
      data: JSON.stringify(data),
      userId: session.user.id,
    },
  })

  return NextResponse.json({ id: calc.id, name: calc.name, createdAt: calc.createdAt }, { status: 201 })
}

// PATCH — переименовать расчёт
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name } = await req.json()
  if (!id || !name) {
    return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
  }

  const calc = await prisma.savedCalculation.findUnique({ where: { id } })
  if (!calc || calc.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.savedCalculation.update({
    where: { id },
    data: { name: String(name).slice(0, 200) },
  })

  return NextResponse.json({ id: updated.id, name: updated.name })
}

// DELETE — удалить расчёт
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const calc = await prisma.savedCalculation.findUnique({ where: { id } })
  if (!calc || calc.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.savedCalculation.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
