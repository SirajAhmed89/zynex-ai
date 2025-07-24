"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { parseMessageContent, MessagePart } from "@/lib/message-parser"
import { CodeBlock } from "./code-block"

interface TypewriterTextProps {
  text: string
  speed?: number // base speed in milliseconds between characters
  className?: string
  onComplete?: () => void
  startImmediately?: boolean
  onTyping?: () => void // Callback during typing for auto-scroll
  variableSpeed?: boolean // Enable variable speed typing
}

export function TypewriterText({ 
  text, 
  speed = 10, // Very fast typing speed (10ms per character)
  className,
  onComplete,
  onTyping,
  startImmediately = true,
  variableSpeed = true
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate dynamic speed based on character
  const getCharacterDelay = useCallback((char: string): number => {
    if (!variableSpeed) return speed
    
    // Punctuation gets longer pauses for natural rhythm
    if (['.', '!', '?'].includes(char)) return speed * 4
    if ([',', ';', ':'].includes(char)) return speed * 2
    if (char === '\n') return speed * 3
    if (char === ' ') return speed * 0.8
    
    // Slight randomness for natural feel (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6
    return Math.round(speed * randomFactor)
  }, [speed, variableSpeed])

  const typeNextCharacter = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1
      
      if (nextIndex >= text.length) {
        setIsComplete(true)
        onComplete?.()
        return prevIndex
      }
      
      setDisplayedText(text.slice(0, nextIndex))
      onTyping?.()
      
      // Schedule next character
      const nextChar = text[nextIndex - 1]
      const delay = getCharacterDelay(nextChar)
      
      timeoutRef.current = setTimeout(typeNextCharacter, delay)
      
      return nextIndex
    })
  }, [text, onComplete, onTyping, getCharacterDelay])

  useEffect(() => {
    if (!startImmediately || !text) return

    // Reset state when text changes
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Start typing effect with initial delay
    timeoutRef.current = setTimeout(typeNextCharacter, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [text, speed, startImmediately, typeNextCharacter])

  // If text is empty, don't render anything
  if (!text) return null

  return (
    <div className={cn("whitespace-pre-wrap leading-relaxed", className)}>
      {displayedText}
    </div>
  )
}
