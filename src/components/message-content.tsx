"use client"

import { parseMessageContent } from "@/lib/message-parser"
import { CodeBlock } from "./code-block"

interface MessageContentProps {
  content: string
  className?: string
  onOpenPreview?: (htmlContent: string) => void
}

interface PreviewButtonProps {
  onPreview: () => void;
}

export const PreviewButton = ({ onPreview }: PreviewButtonProps) => {
  return (
    <button 
      onClick={onPreview}
      className="mt-2 text-blue-500 hover:text-blue-700"
    >
      Preview
    </button>
  );
};

export function MessageContent({ content, className, onOpenPreview }: MessageContentProps) {
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
                onOpenPreview={onOpenPreview}
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
