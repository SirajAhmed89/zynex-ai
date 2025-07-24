"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { User, Bot, Lightbulb, Wrench, BookOpen, Sparkles } from "lucide-react"
import { SimpleTypewriter } from "@/components/simple-typewriter"
import { MessageContent } from "@/components/message-content"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface MessagesProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  currentChatId?: string | null
}


export function Messages({ messages = [], isLoading = false, className, currentChatId }: MessagesProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>(messages)
  const [typewriterMessageId, setTypewriterMessageId] = useState<string | null>(null)
  const prevMessagesLength = useRef(0)
  const prevChatId = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

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
          
          {/* Example prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl">
            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Explain concepts</span>
              </div>
              <div className="text-xs text-muted-foreground">&quot;What are React Server Components?&quot;</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span>Debug code</span>
              </div>
              <div className="text-xs text-muted-foreground">&quot;Help me fix this TypeScript error&quot;</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <BookOpen className="w-4 h-4 text-green-500" />
                <span>Learn something new</span>
              </div>
              <div className="text-xs text-muted-foreground">&quot;Teach me about GraphQL&quot;</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Get creative</span>
              </div>
              <div className="text-xs text-muted-foreground">&quot;Help me brainstorm ideas&quot;</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      className={cn("flex-1 overflow-y-auto p-6", className)}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {displayedMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 group",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 break-words",
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
                <MessageContent content={message.content} />
              )}
              <div className={cn(
                "text-xs mt-2 opacity-70",
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
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-secondary-foreground" />
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
