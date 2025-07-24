export interface MessagePart {
  type: 'text' | 'code'
  content: string
  language?: string
}

export function parseMessage(content: string): MessagePart[] {
  const parts: MessagePart[] = []
  
  // Regex to match code blocks with language specification (```language\ncode\n``` or ```language code```)
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  
  let lastIndex = 0
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim()
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent
        })
      }
    }
    
    // Add the code block
    const language = match[1] || ''
    const code = match[2].trim()
    
    if (code) {
      parts.push({
        type: 'code',
        content: code,
        language
      })
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text after the last code block
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim()
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent
      })
    }
  }
  
  // If no code blocks were found, return the entire content as text
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: content
    })
  }
  
  return parts
}

// Alternative function to detect inline code (single backticks)
export function parseInlineCode(content: string): MessagePart[] {
  const parts: MessagePart[] = []
  const inlineCodeRegex = /`([^`]+)`/g
  
  let lastIndex = 0
  let match
  
  while ((match = inlineCodeRegex.exec(content)) !== null) {
    // Add text before the inline code
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index)
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent
        })
      }
    }
    
    // Add the inline code
    parts.push({
      type: 'code',
      content: match[1],
      language: 'inline'
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex)
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent
      })
    }
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content }]
}

// Enhanced parser that handles both block and inline code
export function parseMessageContent(content: string): MessagePart[] {
  // First parse code blocks
  const blockParts = parseMessage(content)
  
  // Then parse inline code within text parts
  const finalParts: MessagePart[] = []
  
  for (const part of blockParts) {
    if (part.type === 'text') {
      const inlineParts = parseInlineCode(part.content)
      finalParts.push(...inlineParts)
    } else {
      finalParts.push(part)
    }
  }
  
  return finalParts
}
