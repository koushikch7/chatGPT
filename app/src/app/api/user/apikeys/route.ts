import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

// GET /api/user/apikeys - Get user's API keys (without actual key values)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        label: true,
        isValid: true,
        lastValidated: true,
        createdAt: true,
      }
    })

    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/user/apikeys - Add or update an API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, apiKey, label } = body

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and apiKey are required' }, { status: 400 })
    }

    const encryptedKey = encrypt(apiKey)

    const savedKey = await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider
        }
      },
      update: {
        encryptedKey,
        label,
        isValid: true,
        lastValidated: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        provider,
        encryptedKey,
        label,
        isValid: true,
        lastValidated: new Date()
      }
    })

    return NextResponse.json({
      id: savedKey.id,
      provider: savedKey.provider,
      label: savedKey.label,
      isValid: savedKey.isValid,
      lastValidated: savedKey.lastValidated
    })
  } catch (error) {
    console.error('Error saving API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user/apikeys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    await prisma.apiKey.delete({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
