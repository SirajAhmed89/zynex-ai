"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { User, Bot, Lightbulb, Wrench, BookOpen, Sparkles } from "lucide-react"
import { SimpleTypewriter } from "@/components/simple-typewriter"
import { MessageContent } from "@/components/message-content"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system" | "error"
  timestamp: Date
}

interface MessagesProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  currentChatId?: string | null
  onOpenPreview?: () => void
  hasPreviewContent?: boolean
  onSendMessage?: (message: string) => void
}

interface AIPrompt {
  category: string
  icon: string
  color: string
  prompt: string
}


export function Messages({ messages = [], isLoading = false, className, currentChatId, onOpenPreview, onSendMessage }: MessagesProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>(messages)
  const [typewriterMessageId, setTypewriterMessageId] = useState<string | null>(null)
  const prevMessagesLength = useRef(0)
  const prevChatId = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)

  // Scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }
  }

  // Check if user is near bottom to determine auto-scroll behavior
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isNearBottom)
    }
  }

  // Auto-scroll when messages change and track new AI messages
  useEffect(() => {
    setDisplayedMessages(messages)
    
    // Check if we're switching to a different chat
    const isChatSwitch = currentChatId !== prevChatId.current
    
    if (isChatSwitch) {
      // Clear typewriter effect when switching chats
      setTypewriterMessageId(null)
      // Reset message length tracking for new chat
      prevMessagesLength.current = messages.length
    } else {
      // Only apply typewriter effect to newly added AI messages in the same chat
      if (messages.length > prevMessagesLength.current) {
        const latestMessage = messages[messages.length - 1]
        if (latestMessage.role === "assistant") {
          setTypewriterMessageId(latestMessage.id)
        }
      }
      // Update previous messages length
      prevMessagesLength.current = messages.length
    }
    
    // Update previous chat ID
    prevChatId.current = currentChatId ?? null
    
    // Auto-scroll if user is near bottom or if it's a new conversation
    if (shouldAutoScroll || messages.length <= 1) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages, shouldAutoScroll, currentChatId])

  // Auto-scroll when loading state changes (when AI starts/stops typing)
  useEffect(() => {
    if (isLoading && shouldAutoScroll) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [isLoading, shouldAutoScroll])

  // Attach scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Generate AI prompts when component mounts and when chat changes
  useEffect(() => {
    const generatePrompts = async () => {
      setIsLoadingPrompts(true)
      try {
        const response = await fetch('/api/generate-prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setAiPrompts(data.prompts || [])
        } else {
          console.error('Failed to generate prompts')
          // Set fallback prompts
          setAiPrompts([
            {
              category: "Explain concepts",
              icon: "💡",
              color: "amber-500",
              prompt: "What are the key principles of clean code?"
            },
            {
              category: "Debug code",
              icon: "🐛",
              color: "blue-500",
              prompt: "Help me optimize this slow database query"
            },
            {
              category: "Learn something",
              icon: "📚",
              color: "green-500",
              prompt: "Explain how neural networks work"
            },
            {
              category: "Get creative",
              icon: "✨",
              color: "purple-500",
              prompt: "Help me design a modern landing page"
            }
          ])
        }
      } catch (error) {
        console.error('Error generating prompts:', error)
        // Set fallback prompts
        setAiPrompts([
          {
            category: "Explain concepts",
            icon: "💡",
            color: "amber-500",
            prompt: "What are the key principles of clean code?"
          },
          {
            category: "Debug code",
            icon: "🐛",
            color: "blue-500",
            prompt: "Help me optimize this slow database query"
          },
          {
            category: "Learn something",
            icon: "📚",
            color: "green-500",
            prompt: "Explain how neural networks work"
          },
          {
            category: "Get creative",
            icon: "✨",
            color: "purple-500",
            prompt: "Help me design a modern landing page"
          }
        ])
      } finally {
        setIsLoadingPrompts(false)
      }
    }

    // Generate new prompts when messages are empty (new chat or no messages)
    if (displayedMessages.length === 0 && !isLoading) {
      generatePrompts()
    }
  }, [displayedMessages.length, isLoading])

  const handlePromptClick = (prompt: string) => {
    if (onSendMessage) {
      onSendMessage(prompt)
    }
  }

  const getIconComponent = (iconString: string) => {
    switch (iconString) {
      case '💡': return <Lightbulb className="w-4 h-4" />
      case '🐛': return <Wrench className="w-4 h-4" />
      case '📚': return <BookOpen className="w-4 h-4" />
      case '✨': return <Sparkles className="w-4 h-4" />
      default: return <span className="text-sm">{iconString}</span>
    }
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case 'amber-500': return 'text-amber-500'
      case 'blue-500': return 'text-blue-500'
      case 'green-500': return 'text-green-500'
      case 'purple-500': return 'text-purple-500'
      default: return 'text-primary'
    }
  }

  if (displayedMessages.length === 0 && !isLoading) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-6", className)}>
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How can I help you today?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            I&apos;m here to assist you with any questions or tasks you might have. Feel free to ask me anything!
          </p>
          
          {/* AI-Generated prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl">
            {isLoadingPrompts ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-card/50 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-muted-foreground/20 rounded" />
                    <div className="w-20 h-4 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="w-full h-3 bg-muted-foreground/20 rounded" />
                </div>
              ))
            ) : (
              aiPrompts.map((aiPrompt, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                  onClick={() => handlePromptClick(aiPrompt.prompt)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <span className={getColorClass(aiPrompt.color)}>
                      {getIconComponent(aiPrompt.icon)}
                    </span>
                    <span>{aiPrompt.category}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">&quot;{aiPrompt.prompt}&quot;</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      className={cn("flex-1 overflow-y-auto p-4 md:p-6", className)}
    >
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {displayedMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 group",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 break-words text-sm md:text-base",
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-muted-foreground",
                message.role === "user" 
                  ? "rounded-br-md"
                  : "rounded-bl-md"
              )}
            >
              {message.role === "assistant" && message.id === typewriterMessageId ? (
                <SimpleTypewriter 
                  text={message.content} 
                  speed={10}
                  onTyping={() => {
                    // Auto-scroll during typing if user is near bottom
                    if (shouldAutoScroll) {
                      setTimeout(() => scrollToBottom(false), 10)
                    }
                  }}
                  onComplete={() => {
                    // Clear typewriter effect when typing is complete
                    setTypewriterMessageId(null)
                  }}
                />
              ) : (
                <>
                  <MessageContent content={message.content} onOpenPreview={onOpenPreview} />
                </>
              )}
              <div className={cn(
                "text-xs mt-1 md:mt-2 opacity-70",
                message.role === "user" 
                  ? "text-primary-foreground/70" 
                  : "text-muted-foreground/70"
              )}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="w-7 h-7 md:w-8 md:h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  )
}
