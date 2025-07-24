"use client"

import { useState, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle escape key to close preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll on mobile when preview is open
      if (isMobile) {
        document.body.style.overflow = 'hidden'
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isMobile])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code: ', err)
    }
  }

  const handleClose = () => {
    onClose()
  }

  // Enhanced HTML content with navigation prevention
  const enhancedHtmlContent = `
    ${htmlContent}
    <script>
      // Prevent any navigation attempts within the iframe
      (function() {
        // Prevent form submissions from navigating
        document.addEventListener('submit', function(e) {
          e.preventDefault();
          console.log('Form submission prevented in preview');
        });
        
        // Prevent link clicks from navigating
        document.addEventListener('click', function(e) {
          if (e.target.tagName === 'A' && e.target.href) {
            e.preventDefault();
            console.log('Link navigation prevented in preview');
          }
        });
        
        // Prevent window.open calls
        window.open = function() {
          console.log('Window.open prevented in preview');
          return null;
        };
        
        // Prevent location changes
        Object.defineProperty(window, 'location', {
          get: function() { return { href: '#', assign: function(){}, replace: function(){} }; },
          set: function() { console.log('Location change prevented in preview'); }
        });
      })();
    </script>
  `

  if (!isOpen || !htmlContent) {
    return null
  }

  // Mobile overlay mode
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
        
        {/* Mobile Preview Panel */}
        <div className="fixed inset-4 z-50 md:hidden bg-background rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground">HTML Preview</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 w-8 p-0"
                title="Copy HTML code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                title="Close preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full border border-border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={enhancedHtmlContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="HTML Preview"
              />
            </div>
          </div>

          {/* Code Section */}
          <div className="border-t border-border bg-muted/30 max-h-32">
            <div className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Source Code:</div>
              <div className="bg-background border border-border rounded text-xs p-3 max-h-20 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {htmlContent.length > 150 
                    ? htmlContent.substring(0, 150) + "..." 
                    : htmlContent
                  }
                </pre>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Desktop sidebar mode
  return (
    <div className={cn(
      "hidden md:flex flex-col bg-background border-l border-sidebar-border transition-all duration-300 ease-in-out",
      isExpanded ? "w-[28rem]" : "w-80",
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
            className="h-7 w-7 p-0 hover:bg-accent"
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
            className="h-7 w-7 p-0 hover:bg-accent"
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
            onClick={handleClose}
            className="h-7 w-7 p-0 hover:bg-accent hover:text-red-500"
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
            srcDoc={enhancedHtmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="HTML Preview"
            loading="lazy"
          />
        </div>
      </div>

      {/* Code Section (Optional - for reference) */}
      <div className="border-t border-sidebar-border bg-muted/30">
        <div className="p-3">
          <div className="text-xs text-muted-foreground mb-2">Source Code:</div>
          <div className="bg-background border border-border rounded text-xs p-2 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-muted-foreground font-mono">
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
