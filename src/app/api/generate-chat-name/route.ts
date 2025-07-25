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

    // Take only the first 2-3 messages for context (user messages primarily)
    const contextMessages = messages.slice(0, 3).filter(msg => msg.role === 'user' || msg.role === 'assistant')
    
    // Create a modified message array with system prompt as assistant message
    const systemPrompt = `Based on the following conversation, generate a concise, descriptive title (2-6 words) that captures the main topic or theme. The title should be:
- Clear and specific
- Professional but friendly
- No more than 50 characters
- No quotes or special formatting
- Just return the title text, nothing else

Focus on the core subject matter of the conversation.

Conversation:`
    
    const systemMessage: Message = {
      id: 'system-title',
      role: 'assistant',
      content: systemPrompt,
      timestamp: new Date()
    }
    
    const messagesForAI = [systemMessage, ...contextMessages]

    // Get AI response for title generation
    const aiResponse = await getAIResponse(messagesForAI)

    if (!aiResponse.content) {
      throw new Error('No title generated by AI')
    }

    // Clean and validate the generated title
    let title = aiResponse.content.trim()
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '')
    
    // Limit length and add ellipsis if needed
    if (title.length > 50) {
      title = title.substring(0, 47).trim() + '...'
    }

    // Fallback if title is empty or too short
    if (title.length < 3) {
      title = 'New Conversation'
    }

    return NextResponse.json({ title })

  } catch (error: unknown) {
    console.error('Generate chat name API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate chat name',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    service: 'Zynex AI Chat Name Generator'
  })
}
