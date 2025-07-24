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

// Function to convert markdown to plain text
export function markdownToPlainText(content: string): string {
  let text = content;
  
  // Add line breaks around code blocks to preserve formatting
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '\n\t$1\n');
  
  // Remove inline code (`code`) and replace with plain text
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove headers (# ## ### etc.) and keep just the text
  text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');
  
  // Remove bold (**text** or __text__) and keep just the text
  text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic - handle single asterisks and underscores more carefully
  // First remove any remaining single asterisks (not part of bold)
  text = text.replace(/\*([^\*\n]+)\*/g, '$1');
  text = text.replace(/_([^_\n]+)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  text = text.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links [text](url) and keep just the text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove reference links [text][ref]
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  
  // Remove images ![alt](url) and keep just the alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove horizontal rules (--- or ***)
  text = text.replace(/^[-*]{3,}$/gm, '');
  
  // Remove blockquotes (\u003e text) and keep just the text
  text = text.replace(/^\u003e\s+(.*)$/gm, '$1');
  
  // Remove list markers (- * + for unordered, numbers for ordered)
  text = text.replace(/^\s*[-*+]\s+(.*)$/gm, '$1');
  text = text.replace(/^\s*\d+\.\s+(.*)$/gm, '$1');
  
  // Remove table formatting | and keep content
  text = text.replace(/\|/g, ' ');
  text = text.replace(/^[-\s|:]+$/gm, ''); // Remove table separator lines
  
  // Clean up extra whitespace and normalize line breaks
  text = text.replace(/\n\s*\n/g, '\n\n'); // Replace multiple newlines with double newline
  text = text.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  text = text.replace(/^\s+|\s+$/gm, ''); // Trim each line
  text = text.trim();

  text = text.replace(/\n\t/g, '\n\n'); // Restore new lines for code blocks
  
  return text;
}

// Function to strip markdown from text parts only (preserve code structure)
function stripMarkdownFromText(text: string): string {
  let cleanText = text;
  
  // Remove headers (# ## ### etc.) and keep just the text
  cleanText = cleanText.replace(/^#{1,6}\s+(.*)$/gm, '$1');
  
  // Remove bold (**text** or __text__) and keep just the text
  cleanText = cleanText.replace(/\*\*([^\*]+)\*\*/g, '$1');
  cleanText = cleanText.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic - handle single asterisks and underscores more carefully
  cleanText = cleanText.replace(/\*([^\*\n]+)\*/g, '$1');
  cleanText = cleanText.replace(/_([^_\n]+)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  cleanText = cleanText.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links [text](url) and keep just the text
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove reference links [text][ref]
  cleanText = cleanText.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  
  // Remove images ![alt](url) and keep just the alt text
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove horizontal rules (--- or ***)
  cleanText = cleanText.replace(/^[-*]{3,}$/gm, '');
  
  // Remove blockquotes (> text) and keep just the text
  cleanText = cleanText.replace(/^>\s+(.*)$/gm, '$1');
  
  // Remove list markers (- * + for unordered, numbers for ordered)
  cleanText = cleanText.replace(/^\s*[-*+]\s+(.*)$/gm, '$1');
  cleanText = cleanText.replace(/^\s*\d+\.\s+(.*)$/gm, '$1');
  
  return cleanText;
}

// Enhanced parser that handles both block and inline code
export function parseMessageContent(content: string, stripMarkdown: boolean = true): MessagePart[] {
  if (stripMarkdown) {
    // First parse code blocks normally to preserve structure
    const blockParts = parseMessage(content)
    
    // Then process each part
    const finalParts: MessagePart[] = []
    
    for (const part of blockParts) {
      if (part.type === 'text') {
        // Strip markdown from text parts but preserve inline code
        const inlineParts = parseInlineCode(part.content)
        
        // Clean markdown from text parts only
        inlineParts.forEach(inlinePart => {
          if (inlinePart.type === 'text') {
            inlinePart.content = stripMarkdownFromText(inlinePart.content)
          }
        })
        
        finalParts.push(...inlineParts)
      } else {
        // Keep code blocks as-is (they already don't have markdown symbols inside)
        finalParts.push(part)
      }
    }
    
    return finalParts
  }
  
  // Original behavior - parse markdown normally
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
