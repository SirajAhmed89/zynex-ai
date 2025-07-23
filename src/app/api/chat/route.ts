import { NextRequest, NextResponse } from 'next/server'
import { getAIResponse } from '@/lib/ai-service'
import { Message } from '@/home-components/messages'

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Get AI response
    const aiResponse = await getAIResponse(messages)

    return NextResponse.json(aiResponse)

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Zynex AI Chat API'
  })
}
