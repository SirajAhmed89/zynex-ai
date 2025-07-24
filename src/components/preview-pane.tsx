"use client"

import { useState } from "react"
import { X, Maximize2, Minimize2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PreviewPaneProps {
  htmlContent: string
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function PreviewPane({ htmlContent, isOpen, onClose, className }: PreviewPaneProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code: ', err)
    }
  }

  if (!isOpen || !htmlContent) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-col bg-background border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isExpanded ? "w-96" : "w-80",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border bg-muted/50">
        <h3 className="text-sm font-medium text-foreground">HTML Preview</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-7 w-7 p-0"
            title="Copy HTML code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
            title="Close preview"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full border border-border rounded-md overflow-hidden bg-white">
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
          />
        </div>
      </div>

      {/* Code Section (Optional - for reference) */}
      <div className="border-t border-sidebar-border bg-muted/30">
        <div className="p-3">
          <div className="text-xs text-muted-foreground mb-2">Source Code:</div>
          <div className="bg-background border border-border rounded text-xs p-2 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-muted-foreground">
              {htmlContent.length > 200 
                ? htmlContent.substring(0, 200) + "..." 
                : htmlContent
              }
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
