import { Message } from "@/home-components/messages"

export interface AIResponse {
  content: string
  error?: string
  provider: 'openrouter' | 'gemini' | 'fallback'
}

// Convert our message format to API format
const formatMessagesForAPI = (messages: Message[]) => {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }))
}

// OpenRouter API call
async function callOpenRouter(messages: Message[]): Promise<AIResponse> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "Zynex AI Studio",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwen3-235b-a22b-07-25:free",
        "messages": formatMessagesForAPI(messages),
        "temperature": 0.7,
        "max_tokens": 1000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return {
        content: data.choices[0].message.content,
        provider: 'openrouter'
      }
    } else {
      throw new Error('Invalid response format from OpenRouter')
    }

  } catch (error: unknown) {
    console.error('OpenRouter API error:', error)
    throw error
  }
}

// Gemini API call (fallback)
async function callGemini(messages: Message[]): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    // Get the last user message for Gemini (since it doesn't handle conversation history the same way)
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop()
    
    if (!lastUserMessage) {
      throw new Error('No user message found')
    }

    // Build context from conversation history
    let contextualPrompt = lastUserMessage.content
    
    // If there are previous messages, add context
    if (messages.length > 1) {
      const conversationContext = messages.slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n')
      
      contextualPrompt = `Previous conversation context:\n${conversationContext}\n\nCurrent question: ${lastUserMessage.content}`
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        "contents": [
          {
            "parts": [
              {
                "text": contextualPrompt
              }
            ]
          }
        ],
        "generationConfig": {
          "temperature": 0.7,
          "maxOutputTokens": 1000
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return {
        content: data.candidates[0].content.parts[0].text,
        provider: 'gemini'
      }
    } else {
      throw new Error('Invalid response format from Gemini')
    }

  } catch (error: unknown) {
    console.error('Gemini API error:', error)
    throw error
  }
}

// Main AI function with fallback logic
export async function getAIResponse(messages: Message[]): Promise<AIResponse> {
  // First, try OpenRouter (primary)
  try {
    const response = await callOpenRouter(messages)
    return response
  } catch (openRouterError) {
    console.warn('OpenRouter failed, falling back to Gemini:', openRouterError)
    
    // If OpenRouter fails, try Gemini (fallback)
    try {
      const response = await callGemini(messages)
      return response
    } catch (geminiError) {
      console.error('Both AI providers failed:', { openRouterError, geminiError })
      
      // If both fail, return a friendly error message
      return {
        content: "I apologize, but I'm currently experiencing technical difficulties connecting to my AI services. Please try again in a moment. If the issue persists, please check your API configuration.",
        error: `Both providers failed: OpenRouter - ${openRouterError instanceof Error ? openRouterError.message : 'Unknown error'}, Gemini - ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}`,
        provider: 'fallback'
      }
    }
  }
}

