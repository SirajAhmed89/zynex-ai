"use client"

import { useState, useEffect } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Messages, Message } from "./messages"
import { ChatInput } from "./chat-input"
import { PreviewPane } from "@/components/preview-pane"
import { extractHtmlContent } from "@/components/simple-typewriter"
import { cn } from "@/lib/utils"

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = 'zynex-chats'
const SIDEBAR_STORAGE_KEY = 'zynex-sidebar-open'

export default function HomePage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Load chats and sidebar state from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY)
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: Chat & { messages: (Message & { timestamp: string })[] }) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: Message & { timestamp: string }) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setChats(parsedChats)
        
        // Auto-select the most recent chat if exists
        if (parsedChats.length > 0) {
          const mostRecentChat = parsedChats.sort((a: Chat, b: Chat) => 
            b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0]
          setSelectedChatId(mostRecentChat.id)
          setCurrentMessages(mostRecentChat.messages)
        }
      } catch (error) {
        console.error('Failed to load chats from localStorage:', error)
      }
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (savedSidebarState !== null) {
      setIsSidebarOpen(JSON.parse(savedSidebarState))
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    }
  }, [chats])

  // Extract HTML content from assistant messages and update preview pane
  useEffect(() => {
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      const htmlContent = extractHtmlContent(lastMessage.content)
      if (htmlContent && htmlContent !== previewHtmlContent) {
        setPreviewHtmlContent(htmlContent)
        setIsPreviewOpen(true)
      }
    }
  }, [currentMessages, previewHtmlContent])

  // Generate chat title from first user message (fallback)
  const generateChatTitle = (firstMessage: string): string => {
    const maxLength = 50
    return firstMessage.length > maxLength 
      ? firstMessage.substring(0, maxLength).trim() + '...'
      : firstMessage
  }

  // Generate AI-powered chat title
  const generateAIChatTitle = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/generate-chat-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.title || 'New Conversation'
    } catch (error) {
      console.error('Failed to generate AI chat title:', error)
      // Fallback to first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user')
      return firstUserMessage ? generateChatTitle(firstUserMessage.content) : 'New Conversation'
    }
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date()
    }
    
    let currentChatId = selectedChatId
    
    // If no chat is selected or this is the first message, create a new chat
    if (!currentChatId || currentMessages.length === 0) {
      currentChatId = `chat-${Date.now()}`
      const newChat: Chat = {
        id: currentChatId,
        title: generateChatTitle(content),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setChats(prev => [newChat, ...prev])
      setSelectedChatId(currentChatId)
      setCurrentMessages([userMessage])
    } else {
      // Add message to existing chat
      const updatedMessages = [...currentMessages, userMessage]
      setCurrentMessages(updatedMessages)
      
      // Update the chat in the chats array
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: updatedMessages, updatedAt: new Date() }
          : chat
      ))
    }
    
    setIsLoading(true)
    
    try {
      // Get current messages for context (before adding user message to state)
      const messagesForAI = currentMessages.length === 0 ? [userMessage] : [...currentMessages, userMessage]
      
      // Call the AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesForAI }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const aiResponse = await response.json()
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        role: "assistant",
        timestamp: new Date()
      }
      
      // Get the current messages (which now includes the user message)
      const currentMessagesWithUser = currentMessages.length === 0 ? [userMessage] : [...currentMessages, userMessage]
      const finalMessages = [...currentMessagesWithUser, assistantMessage]
      
      setCurrentMessages(finalMessages)
      
      // Update the chat with both user and assistant messages
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: finalMessages, updatedAt: new Date() }
          : chat
      ))
      
      // Generate AI title after 2-3 messages (when we have enough context)
      if (finalMessages.length >= 3 && finalMessages.length <= 4) {
        try {
          const aiTitle = await generateAIChatTitle(finalMessages)
          
          // Update chat title with AI-generated name
          setChats(prev => prev.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, title: aiTitle }
              : chat
          ))
        } catch (error) {
          console.error('Failed to update chat title:', error)
        }
      }
      
    } catch (error: unknown) {
      console.error('AI API error:', error)
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: "assistant",
        timestamp: new Date()
      }
      
      const updatedMessages = [...(currentMessages.length === 0 ? [userMessage] : currentMessages), errorMessage]
      setCurrentMessages(updatedMessages)
      
      // Update the chat with the error message
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: updatedMessages, updatedAt: new Date() }
          : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setCurrentMessages([])
    setSelectedChatId(null)
  }

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chats.find(chat => chat.id === chatId)
    if (selectedChat) {
      setSelectedChatId(chatId)
      setCurrentMessages(selectedChat.messages)
    }
  }

  const handleDeleteChat = (chatId: string) => {
    // Remove chat from list
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    
    // If the deleted chat was selected, clear selection
    if (selectedChatId === chatId) {
      setSelectedChatId(null)
      setCurrentMessages([])
    }
    
    // Update localStorage
    const updatedChats = chats.filter(chat => chat.id !== chatId)
    if (updatedChats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date() }
        : chat
    ))
  }

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewHtmlContent(null)
  }

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        className={cn(
          "hidden lg:flex transition-all duration-300 ease-in-out border-r border-sidebar-border",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"
        )}
        chats={chats}
        selectedChatId={selectedChatId}
        onNewChat={handleNewChat} 
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
      />

      {/* Preview Pane */}
      {isPreviewOpen && previewHtmlContent && (
        <PreviewPane
          htmlContent={previewHtmlContent}
          onClose={handleClosePreview}
          isOpen={isPreviewOpen}
          className="w-96 border-r border-sidebar-border"
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header 
          onNewChat={handleNewChat} 
          onSelectChat={handleSelectChat}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <Messages 
            messages={currentMessages} 
            isLoading={isLoading}
            currentChatId={selectedChatId}
            className="h-full"
          />
        </div>
        
        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          className="flex-shrink-0"
        />
      </div>
    </div>
  )
}
