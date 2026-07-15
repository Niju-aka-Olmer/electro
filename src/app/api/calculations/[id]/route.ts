import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const calc = await prisma.savedCalculation.findUnique({ where: { id } })
  if (!calc || calc.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: calc.id,
    name: calc.name,
    data: JSON.parse(calc.data),
    createdAt: calc.createdAt,
    updatedAt: calc.updatedAt,
  })
}
