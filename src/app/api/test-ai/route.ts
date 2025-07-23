import { NextResponse } from 'next/server'
import { testAIConnections } from '@/lib/ai-service'

export async function GET() {
  try {
    const results = await testAIConnections()
    
    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      results,
      summary: {
        openrouter: results.openrouter ? '✅ Connected' : '❌ Failed',
        gemini: results.gemini ? '✅ Connected' : '❌ Failed',
        overall: (results.openrouter || results.gemini) ? '✅ At least one provider working' : '❌ Both providers failed'
      },
      errors: results.errors.length > 0 ? results.errors : null,
      recommendations: getRecommendations(results)
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        recommendation: 'Check your API keys in .env.local file'
      },
      { status: 500 }
    )
  }
}

function getRecommendations(results: any): string[] {
  const recommendations: string[] = []
  
  if (!results.openrouter && !results.gemini) {
    recommendations.push('Both AI providers failed. Check your API keys in .env.local')
  } else if (!results.openrouter) {
    recommendations.push('OpenRouter failed but Gemini is working. Check OPENROUTER_API_KEY')
  } else if (!results.gemini) {
    recommendations.push('Gemini failed but OpenRouter is working. Check GEMINI_API_KEY')
  } else {
    recommendations.push('Both providers are working correctly!')
  }
  
  if (results.errors.length > 0) {
    recommendations.push('See errors array for detailed error messages')
  }
  
  return recommendations
}
