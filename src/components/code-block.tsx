"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Copy, Check, Eye } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  onOpenPreview?: (htmlContent: string) => void
}

export function CodeBlock({ code, language = "", className, onOpenPreview }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const isHTML = language.toLowerCase() === 'html' || 
                 code.trim().startsWith('<!DOCTYPE') || 
                 code.trim().startsWith('<html')

  return (
    <div className={cn("rounded-lg border border-border bg-muted/30 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'code'}
        </span>
        <div className="flex items-center gap-2">
          {/* HTML Preview Button */}
          {isHTML && onOpenPreview && (
            <button
              onClick={() => onOpenPreview(code)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
              title="Preview HTML"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          )}
          
          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="text-foreground font-mono leading-relaxed">
            {code}
          </code>
        </pre>
      </div>

    </div>
  )
}
