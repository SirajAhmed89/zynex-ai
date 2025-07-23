import { NextRequest, NextResponse } from 'next/server';

export interface SpeechToTextRequest {
  audioBlob?: string; // Base64 encoded audio
  transcript?: string; // For post-processing
  language?: string;
  enhance?: boolean; // Whether to use AI for enhancement
}

export interface SpeechToTextResponse {
  transcript: string;
  confidence?: number;
  enhanced?: boolean;
  originalTranscript?: string;
  error?: string;
}

// AI-enhanced text processing using OpenRouter or Gemini
async function enhanceTranscriptWithAI(transcript: string, language = 'en-US'): Promise<{ enhanced: string; originalTranscript: string }> {
  try {
    // First try OpenRouter for text enhancement
    if (process.env.OPENROUTER_API_KEY) {
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
          "messages": [
            {
              "role": "system",
              "content": `You are a speech-to-text accuracy enhancer. Your job is to correct and improve transcribed speech while maintaining the original meaning and intent. Fix grammar, punctuation, spelling errors, and make the text more readable. Language: ${language.split('-')[0]}`
            },
            {
              "role": "user", 
              "content": `Please enhance this speech transcript. Fix grammar, punctuation, capitalization, and spelling errors while maintaining the exact original meaning and intent. Do not add or remove information, just improve readability:\n\nOriginal: "${transcript}"\n\nEnhanced:`
            }
          ],
          "temperature": 0.3,
          "max_tokens": 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return {
            enhanced: data.choices[0].message.content.replace(/^["']|["']$/g, '').trim(),
            originalTranscript: transcript
          };
        }
      }
    }

    // Fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
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
                  "text": `You are a speech-to-text accuracy enhancer. Please improve this speech transcript by fixing grammar, punctuation, and spelling while maintaining the original meaning:\n\n"${transcript}"\n\nReturn only the enhanced text without quotes or additional commentary.`
                }
              ]
            }
          ],
          "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 500
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return {
            enhanced: data.candidates[0].content.parts[0].text.replace(/^["']|["']$/g, '').trim(),
            originalTranscript: transcript
          };
        }
      }
    }

    // If both AI services fail, return original
    return {
      enhanced: transcript,
      originalTranscript: transcript
    };

  } catch (error) {
    console.error('AI enhancement failed:', error);
    return {
      enhanced: transcript,
      originalTranscript: transcript
    };
  }
}

// Basic text cleanup without AI
function basicTextCleanup(transcript: string): string {
  return transcript
    // Fix common speech-to-text issues
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Add space after punctuation
    .replace(/([a-z])([.!?])([A-Z])/g, '$1$2 $3') // Add space between sentences
    // Capitalize first letter of sentences
    .replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase())
    // Basic punctuation fixes
    .replace(/\s+([.!?,:;])/g, '$1') // Remove spaces before punctuation
    .replace(/([.!?]){2,}/g, '$1') // Remove duplicate punctuation
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: SpeechToTextRequest = await request.json();
    
    if (!body.transcript && !body.audioBlob) {
      return NextResponse.json(
        { error: 'Either transcript or audioBlob is required' },
        { status: 400 }
      );
    }

    // For now, we'll focus on transcript enhancement since browser speech recognition
    // already provides the initial transcript
    if (body.transcript) {
      let finalTranscript = body.transcript;
      let enhanced = false;
      let originalTranscript = body.transcript;

      // Apply basic cleanup first
      finalTranscript = basicTextCleanup(finalTranscript);

      // If AI enhancement is requested and transcript is substantial enough
      if (body.enhance && finalTranscript.length > 10) {
        try {
          const aiResult = await enhanceTranscriptWithAI(finalTranscript, body.language);
          finalTranscript = aiResult.enhanced;
          originalTranscript = aiResult.originalTranscript;
          enhanced = true;
        } catch (error) {
          console.warn('AI enhancement failed, using basic cleanup:', error);
        }
      }

      const response: SpeechToTextResponse = {
        transcript: finalTranscript,
        enhanced,
        originalTranscript: enhanced ? originalTranscript : undefined
      };

      return NextResponse.json(response);
    }

    // If audioBlob is provided (for future enhancement with audio processing)
    if (body.audioBlob) {
      // This would be implemented for server-side audio processing
      // For now, return an error as we're focusing on client-side recognition
      return NextResponse.json(
        { error: 'Audio processing not yet implemented. Please use client-side speech recognition.' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'No valid input provided' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Speech-to-text API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Zynex Speech-to-Text API',
    features: {
      browserSpeechRecognition: true,
      aiEnhancement: !!(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY),
      audioProcessing: false // Future feature
    }
  });
}
