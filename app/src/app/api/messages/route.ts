import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/messages - Add a message to conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      conversationId, 
      role, 
      content, 
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      processingTime,
      finishReason,
      parentId
    } = body

    if (!conversationId || !role || !content) {
      return NextResponse.json({ error: 'conversationId, role, and content are required' }, { status: 400 })
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        model,
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        totalTokens: totalTokens || 0,
        processingTime,
        finishReason,
        parentId
      }
    })

    // Update conversation's total tokens and timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        totalTokens: { increment: totalTokens || 0 },
        updatedAt: new Date()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/messages - Update a message
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, content, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Verify ownership through conversation
    const existing = await prisma.message.findUnique({
      where: { id },
      include: { conversation: true }
    })

    if (!existing || existing.conversation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const message = await prisma.message.update({
      where: { id },
      data: {
        content,
        ...updates,
        isEdited: content !== existing.content,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/messages - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Verify ownership through conversation
    const existing = await prisma.message.findUnique({
      where: { id },
      include: { conversation: true }
    })

    if (!existing || existing.conversation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    await prisma.message.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
