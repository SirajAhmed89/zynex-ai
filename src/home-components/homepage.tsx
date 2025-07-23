"use client"

import { useState, useEffect } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Messages, Message } from "./messages"
import { ChatInput } from "./chat-input"

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = 'zynex-chats'

export default function HomePage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  // Load chats from localStorage on mount
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
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    }
  }, [chats])

  // Generate chat title from first user message
  const generateChatTitle = (firstMessage: string): string => {
    const maxLength = 50
    return firstMessage.length > maxLength 
      ? firstMessage.substring(0, maxLength).trim() + '...'
      : firstMessage
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

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        className="hidden lg:flex" 
        chats={chats}
        selectedChatId={selectedChatId}
        onNewChat={handleNewChat} 
        onSelectChat={handleSelectChat}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header 
          onNewChat={handleNewChat} 
          onSelectChat={handleSelectChat}
        />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <Messages 
            messages={currentMessages} 
            isLoading={isLoading}
            className="h-full"
          />
        </div>
        
        {/* Chat Input */}
        <div className="flex-shrink-0">
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
