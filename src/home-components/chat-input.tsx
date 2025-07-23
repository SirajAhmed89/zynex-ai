"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Send, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage?: (message: string) => void
  disabled?: boolean
  className?: string
}

export function ChatInput({ onSendMessage, disabled = false, className }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim())
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Here you would implement actual voice recording logic
  }

  return (
    <div className={cn("border-t border-border bg-background", className)}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="relative flex items-end gap-3 bg-background border border-input rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                adjustHeight()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Zynex..."
              disabled={disabled}
              className={cn(
                "w-full resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-0",
                "placeholder:text-muted-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[54px] max-h-[200px] overflow-y-auto"
              )}
              rows={1}
            />
          </div>

          <div className="flex items-center gap-2 pr-2 pb-2">
            {/* Voice Recording Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={toggleRecording}
              className={cn(
                "h-10 w-10 rounded-lg transition-colors",
                isRecording 
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Send Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || !message.trim()}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg transition-all",
                message.trim() && !disabled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Character count or status */}
        <div className="flex justify-between items-center mt-2 px-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording...</span>
              </div>
            )}
          </div>
          <div>{message.length}/4000</div>
        </div>
      </div>
    </div>
  )
}
