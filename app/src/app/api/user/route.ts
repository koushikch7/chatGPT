import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/user - Get current user data with all related data
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true,
        apiKeys: {
          select: {
            id: true,
            provider: true,
            label: true,
            isValid: true,
            lastValidated: true,
            createdAt: true,
          }
        },
        memories: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
          include: { settings: true }
        },
        conversations: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
          include: {
            settings: true,
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, image } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
