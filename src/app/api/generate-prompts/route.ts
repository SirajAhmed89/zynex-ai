import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates engaging conversation starter prompts. Generate exactly 4 diverse and interesting prompts that users might want to ask an AI assistant. 

The prompts should be:
- Varied in topics (coding, learning, creativity, problem-solving, etc.)
- Concise but specific enough to be interesting
- Actionable and likely to lead to helpful responses
- Different from typical generic questions

Return the response as a JSON object with this exact structure:
{
  "prompts": [
    {
      "category": "Category Name",
      "icon": "emoji or icon identifier",
      "color": "color-class",
      "prompt": "The actual prompt text"
    }
  ]
}

Use these categories and corresponding details:
- "Explain concepts": icon "💡", color "amber-500"
- "Debug code": icon "🐛", color "blue-500" 
- "Learn something": icon "📚", color "green-500"
- "Get creative": icon "✨", color "purple-500"

Make sure each prompt is unique and engaging!`
          }
        ],
        max_tokens: 800,
        temperature: 0.9
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    try {
      const parsedContent = JSON.parse(content)
      return NextResponse.json(parsedContent)
    } catch {
      console.error('Failed to parse AI response:', content)
      // Fallback prompts if AI response can't be parsed
      return NextResponse.json({
        prompts: [
          {
            category: "Explain concepts",
            icon: "💡",
            color: "amber-500",
            prompt: "Explain how machine learning algorithms learn from data"
          },
          {
            category: "Debug code",
            icon: "🐛", 
            color: "blue-500",
            prompt: "Help me optimize this database query for better performance"
          },
          {
            category: "Learn something",
            icon: "📚",
            color: "green-500", 
            prompt: "Teach me about the fundamentals of blockchain technology"
          },
          {
            category: "Get creative",
            icon: "✨",
            color: "purple-500",
            prompt: "Help me brainstorm unique features for a productivity app"
          }
        ]
      })
    }

  } catch (error) {
    console.error('Error generating prompts:', error)
    
    // Return fallback prompts in case of any error
    return NextResponse.json({
      prompts: [
        {
          category: "Explain concepts",
          icon: "💡",
          color: "amber-500",
          prompt: "What are the key differences between REST and GraphQL APIs?"
        },
        {
          category: "Debug code",
          icon: "🐛",
          color: "blue-500",
          prompt: "How can I improve the performance of my React application?"
        },
        {
          category: "Learn something",
          icon: "📚", 
          color: "green-500",
          prompt: "Explain the concept of containerization with Docker"
        },
        {
          category: "Get creative",
          icon: "✨",
          color: "purple-500",
          prompt: "Help me design a user-friendly interface for a mobile app"
        }
      ]
    })
  }
}
