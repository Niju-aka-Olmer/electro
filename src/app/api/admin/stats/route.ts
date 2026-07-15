import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Проверка isAdmin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [totalUsers, totalCalcs, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.savedCalculation.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: { select: { calculations: true } },
      },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    totalCalcs,
    recentUsers: recentUsers.map(u => ({
      ...u,
      calculationsCount: u._count.calculations,
      _count: undefined,
    })),
  })
}
