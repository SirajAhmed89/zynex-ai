"use client"

import { parseMessageContent } from "@/lib/message-parser"
import { CodeBlock } from "./code-block"

interface MessageContentProps {
  content: string
  className?: string
}

export function MessageContent({ content, className }: MessageContentProps) {
  const parts = parseMessageContent(content)

  return (
    <div className={className}>
      {parts.map((part, index) => (
        <div key={index} className={index > 0 ? "mt-4" : ""}>
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
