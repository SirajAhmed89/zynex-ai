"use client"

import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react"
import { Send, Mic, MicOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getVoiceRecognitionService, VoiceRecognitionResult, VoiceRecognitionError } from "@/lib/voice-recognition"
import type { SpeechToTextResponse } from "@/app/api/speech-to-text/route"
import Visualizer from "./visualizer" // Importing visualizer for audio visualization.

interface ChatInputProps {
  onSendMessage?: (message: string) => void
  disabled?: boolean
  className?: string
}

export function ChatInput({ onSendMessage, disabled = false, className }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [useAIEnhancement] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceRecognitionService = getVoiceRecognitionService()

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

  // AI-enhanced transcription processing
  const enhanceTranscript = useCallback(async (transcript: string): Promise<string> => {
    if (!useAIEnhancement || transcript.length < 10) {
      return transcript;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          enhance: true,
          language: 'en-US'
        })
      });

      if (response.ok) {
        const result: SpeechToTextResponse = await response.json();
        return result.transcript;
      }
    } catch (error) {
      console.warn('AI enhancement failed, using original transcript:', error);
    } finally {
      setIsProcessing(false);
    }

    return transcript;
  }, [useAIEnhancement]);

  // Handle voice recognition results
  const handleVoiceResult = useCallback(async (result: VoiceRecognitionResult) => {
    if (result.isFinal) {
      setInterimTranscript("");
      const enhancedTranscript = await enhanceTranscript(result.transcript);
      setMessage((prev) => {
        const newMessage = prev.trim() ? `${prev} ${enhancedTranscript}` : enhancedTranscript;
        return newMessage.trim();
      });
      adjustHeight();
    } else {
      setInterimTranscript(result.transcript);
    }
  }, [enhanceTranscript]);

  // Handle voice recognition errors
  const handleVoiceError = useCallback((error: VoiceRecognitionError) => {
    console.error("Voice recognition error:", error);
    setVoiceError(error.message);
    setIsRecording(false);
    setInterimTranscript("");
    
    // Clear error after 5 seconds
    setTimeout(() => setVoiceError(null), 5000);
  }, []);

  useEffect(() => {
    if (!voiceRecognitionService.isRecognitionSupported()) {
      console.warn("Voice recognition is not supported by this browser.");
    }
    return () => {
      voiceRecognitionService.cleanup();
    };
  }, [voiceRecognitionService]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      voiceRecognitionService.stopListening();
      setIsRecording(false);
      setInterimTranscript("");
    } else {
      setVoiceError(null);
      
      const hasPermission = await voiceRecognitionService.requestMicrophonePermission();
      if (!hasPermission) {
        setVoiceError('Microphone access denied. Please allow microphone permissions.');
        return;
      }

      const initialized = voiceRecognitionService.initialize({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        onStart: () => {
          setIsRecording(true);
          setVoiceError(null);
        },
        onEnd: () => {
          setIsRecording(false);
          setInterimTranscript("");
        },
      }, {
        language: 'en-US',
        continuous: true, // Enable continuous recording
        interimResults: true,
        maxAlternatives: 1
      });

      if (initialized) {
        const started = voiceRecognitionService.startListening();
        if (!started) {
          setVoiceError('Failed to start voice recognition. Please try again.');
        }
      } else {
        setVoiceError('Voice recognition is not supported in this browser.');
      }
    }
  }, [isRecording, voiceRecognitionService, handleVoiceResult, handleVoiceError]);

  return (
    <div className={cn("border-t border-border bg-background", className)}>
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-3">
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
                "w-full resize-none border-0 bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-0",
                "placeholder:text-muted-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[44px] max-h-[200px] overflow-y-auto"
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

        {/* Audio Visualizer */}
        {isRecording && (
          <div className="flex justify-center mt-2">
            <Visualizer isActive={isRecording} className="bg-muted/50 rounded-lg" />
          </div>
        )}
        
        {/* Interim Transcript Display */}
        {interimTranscript && (
          <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground italic">
            <span className="text-xs font-medium">Listening:</span> {interimTranscript}
          </div>
        )}
        
        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-2 px-3 py-2 bg-blue-500/10 rounded-lg text-sm text-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Enhancing with AI...</span>
            </div>
          </div>
        )}
        
        {/* Voice Error Display */}
        {voiceError && (
          <div className="mt-2 px-3 py-2 bg-red-500/10 rounded-lg text-sm text-red-600">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>{voiceError}</span>
            </div>
          </div>
        )}

        {/* Character count or status */}
        <div className="flex justify-between items-center mt-2 px-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording... (Click mic to stop)</span>
              </div>
            )}
          </div>
          <div>{message.length}/4000</div>
        </div>
      </div>
    </div>
  )
}
