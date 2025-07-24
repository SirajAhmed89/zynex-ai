"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { parseMessageContent, MessagePart } from "@/lib/message-parser"
import { CodeBlock } from "./code-block"

interface EnhancedTypewriterTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
  startImmediately?: boolean
  onTyping?: () => void
  variableSpeed?: boolean
}

export function EnhancedTypewriterText({ 
  text, 
  speed = 10,
  className,
  onComplete,
  onTyping,
  startImmediately = true,
  variableSpeed = false
}: EnhancedTypewriterTextProps) {
  const [displayedParts, setDisplayedParts] = useState<MessagePart[]>([])
  const [currentPartIndex, setCurrentPartIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [parsedParts, setParsedParts] = useState<MessagePart[]>([])

  // Parse the message content once
  useEffect(() => {
    const parts = parseMessageContent(text)
    setParsedParts(parts)
  }, [text])

  const getCharacterDelay = useCallback((char: string): number => {
    if (!variableSpeed) return speed
    
    if (['.', '!', '?'].includes(char)) return speed * 3
    if ([',', ';', ':'].includes(char)) return speed * 1.5
    if (char === '\n') return speed * 2
    if (char === ' ') return speed * 0.8
    
    const randomFactor = 0.8 + Math.random() * 0.4
    return Math.round(speed * randomFactor)
  }, [speed, variableSpeed])

  const typeNextCharacter = useCallback(() => {
    if (parsedParts.length === 0) return
    
    const parts = parsedParts
    
    if (currentPartIndex >= parts.length) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    const currentPart = parts[currentPartIndex]
    
    // If it's a code block, add it immediately
    if (currentPart.type === 'code') {
      setDisplayedParts(prev => [...prev, currentPart])
      setCurrentPartIndex(prev => prev + 1)
      setCurrentCharIndex(0)
      onTyping?.()
      
      // Continue with next part after a brief pause
      timeoutRef.current = setTimeout(typeNextCharacter, speed * 2)
      return
    }

    // For text parts, type character by character
    if (currentCharIndex >= currentPart.content.length) {
      // Finished current text part, move to next part
      setCurrentPartIndex(prev => prev + 1)
      setCurrentCharIndex(0)
      timeoutRef.current = setTimeout(typeNextCharacter, speed)
      return
    }

    // Type next character
    const nextChar = currentPart.content[currentCharIndex]
    const partialContent = currentPart.content.slice(0, currentCharIndex + 1)
    
    setDisplayedParts(prev => {
      const newParts = [...prev]
      const lastPartIndex = newParts.length - 1
      
      // Check if we need to update existing text part or add new one
      if (lastPartIndex >= 0 && 
          newParts[lastPartIndex].type === 'text' && 
          newParts[lastPartIndex].language === currentPart.language &&
          currentCharIndex > 0) {
        // Update existing text part
        newParts[lastPartIndex] = {
          ...currentPart,
          content: partialContent
        }
      } else {
        // Add new text part
        newParts.push({
          ...currentPart,
          content: partialContent
        })
      }
      
      return newParts
    })

    setCurrentCharIndex(prev => prev + 1)
    onTyping?.()

    const delay = getCharacterDelay(nextChar)
    timeoutRef.current = setTimeout(typeNextCharacter, delay)
  }, [parsedParts, currentPartIndex, currentCharIndex, speed, getCharacterDelay, onComplete, onTyping])

  useEffect(() => {
    if (!startImmediately || !text || parsedParts.length === 0) return

    // Reset state
    setDisplayedParts([])
    setCurrentPartIndex(0)
    setCurrentCharIndex(0)
    setIsComplete(false)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Start typing
    timeoutRef.current = setTimeout(typeNextCharacter, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [text, speed, startImmediately, parsedParts, typeNextCharacter])

  if (!text) return null

  return (
    <div className={cn("space-y-4", className)}>
      {displayedParts.map((part, index) => (
        <div key={index}>
          {part.type === 'code' ? (
            <CodeBlock 
              code={part.content} 
              language={part.language} 
              className="my-2"
            />
          ) : part.language === 'inline' ? (
            <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
              {part.content}
            </code>
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
