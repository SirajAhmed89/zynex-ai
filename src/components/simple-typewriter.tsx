"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { parseMessageContent } from "@/lib/message-parser"
import { CodeBlock } from "./code-block"

interface SimpleTypewriterProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
  onTyping?: () => void
}

export function SimpleTypewriter({ 
  text, 
  speed = 15,
  className,
  onComplete,
  onTyping
}: SimpleTypewriterProps) {
  const [displayedContent, setDisplayedContent] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!text) return

    // Reset state
    setDisplayedContent("")
    indexRef.current = 0

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Start typing
    intervalRef.current = setInterval(() => {
      if (indexRef.current >= text.length) {
        // Typing complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        onComplete?.()
        return
      }

      // Add next character
      indexRef.current += 1
      setDisplayedContent(text.slice(0, indexRef.current))
      onTyping?.()
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [text, speed, onComplete, onTyping])

  if (!text) return null

  // Parse the displayed content to show code blocks properly
  const parts = parseMessageContent(displayedContent)

  return (
    <div className={cn("space-y-2", className)}>
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === 'code' ? (
            part.language === 'inline' ? (
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                {part.content}
              </code>
            ) : (
              <CodeBlock 
                code={part.content} 
                language={part.language} 
                className="my-2"
              />
            )
          ) : (
            <span className="whitespace-pre-wrap leading-relaxed">
              {part.content}
            </span>
          )}
        </div>
      ))}
      
    </div>
  )
}

// Utility function to extract HTML content from parsed message parts
export function extractHtmlContent(text: string): string | null {
  const parts = parseMessageContent(text)
  
  for (const part of parts) {
    if (part.type === 'code' && part.language === 'html') {
      return part.content
    }
  }
  
  return null
}
