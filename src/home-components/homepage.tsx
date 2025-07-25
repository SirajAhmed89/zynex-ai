"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Messages, Message } from "./messages"
import { ChatInput } from "./chat-input"
import { PreviewPane } from "@/components/preview-pane"
import { extractHtmlContent } from "@/components/simple-typewriter"
import { cn } from "@/lib/utils"
import { ChatService, ProfileService, DbProfile } from "@/lib/database"
import { supabaseClient as supabase } from "@/lib/supabase-client"
import { useToastActions } from "@/components/ui/toast"
import { User } from "@supabase/supabase-js"

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const SIDEBAR_STORAGE_KEY = 'zynex-sidebar-open'

export default function HomePage() {
  const router = useRouter()
  const toast = useToastActions()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DbProfile | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  // For anonymous users - temporary chats stored in state only
  const [tempChats, setTempChats] = useState<Chat[]>([])

  // Check authentication and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is signed in - ensure profile exists and load data
          setUser(session.user)
          
          // Ensure profile exists
          await ProfileService.ensureProfileExists()
          
          // Fetch user profile
          const profile = await ProfileService.getCurrentUserProfile()
          setUserProfile(profile)
          
          const userChats = await ChatService.getAllChats()
          setChats(userChats)

          // Auto-select the most recent chat if exists
          if (userChats.length > 0) {
            const mostRecentChat = userChats[0] // Already sorted by updated_at desc
            setSelectedChatId(mostRecentChat.id)
            setCurrentMessages(mostRecentChat.messages)
          }
        } else {
          // User is anonymous - no chats to load, start fresh
          setUser(null)
          setChats([])
          setTempChats([])
        }

        // Load sidebar state from localStorage
        const savedSidebarState = localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (savedSidebarState !== null) {
          setIsSidebarOpen(JSON.parse(savedSidebarState))
        }

      } catch (error) {
        console.error('Error initializing app:', error)
        // Don't redirect on error - allow anonymous usage
        setUser(null)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeApp()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // User signed out - clear user data but don't redirect
        setUser(null)
        setChats([])
        setTempChats([])
        setCurrentMessages([])
        setSelectedChatId(null)
      } else if (event === 'SIGNED_IN' && session) {
        // User signed in - load their chats
        setUser(session.user)
        const userChats = await ChatService.getAllChats()
        setChats(userChats)
        // Clear temp chats as user now has persistent storage
        setTempChats([])
        
        // Show toast notification for sign in
        const userName = session.user.user_metadata?.full_name || "User"
        toast.success(`Welcome back, ${userName}!`)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isInitializing])

  // Extract HTML content from assistant messages
  useEffect(() => {
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      const htmlContent = extractHtmlContent(lastMessage.content)
      if (htmlContent && htmlContent !== previewHtmlContent) {
        setPreviewHtmlContent(htmlContent)
        // Don't auto-open preview - let user click the button to open
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
    const setActiveChats = user ? setChats : setTempChats
    
    // If no chat is selected or this is the first message, create a new chat
    if (!currentChatId || currentMessages.length === 0) {
      const title = generateChatTitle(content)
      
      if (user) {
        // Authenticated user - save to database
        currentChatId = await ChatService.createChat(title, userMessage)
        
        if (!currentChatId) {
          console.error('Failed to create chat')
          return
        }
      } else {
        // Anonymous user - create temporary chat
        currentChatId = `temp_${Date.now()}`
      }
      
      // Create local chat object
      const newChat: Chat = {
        id: currentChatId,
        title,
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setActiveChats(prev => [newChat, ...prev])
      setSelectedChatId(currentChatId)
      setCurrentMessages([userMessage])
    } else {
      if (user) {
        // Authenticated user - save to database
        const success = await ChatService.addMessage(currentChatId, userMessage)
        
        if (!success) {
          console.error('Failed to add message')
          return
        }
      }

      // Update local state
      const updatedMessages = [...currentMessages, userMessage]
      setCurrentMessages(updatedMessages)
      
      // Update the chat in the chats array
      setActiveChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: updatedMessages, updatedAt: new Date() }
          : chat
      ))
    }
    
    setIsLoading(true)
    
    try {
      // Get current messages for context
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
      
      if (user) {
        // Authenticated user - save to database
        const success = await ChatService.addMessage(currentChatId!, assistantMessage)
        
        if (!success) {
          console.error('Failed to save assistant message')
          return
        }
      }

      // Update local state
      const currentMessagesWithUser = currentMessages.length === 0 ? [userMessage] : [...currentMessages, userMessage]
      const finalMessages = [...currentMessagesWithUser, assistantMessage]
      
      setCurrentMessages(finalMessages)
      
      // Update the chat with both user and assistant messages
      setActiveChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: finalMessages, updatedAt: new Date() }
          : chat
      ))
      
      // Generate AI title after 2-3 messages (when we have enough context)
      if (finalMessages.length >= 3 && finalMessages.length <= 4) {
        try {
          const aiTitle = await generateAIChatTitle(finalMessages)
          
          if (user) {
            // Update chat title in database for authenticated users
            await ChatService.updateChatTitle(currentChatId!, aiTitle)
          }
          
          // Update local state
          setActiveChats(prev => prev.map(chat => 
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
      
      if (user) {
        // Save error message to database for authenticated users
        await ChatService.addMessage(currentChatId!, errorMessage)
      }
      
      const updatedMessages = [...(currentMessages.length === 0 ? [userMessage] : [...currentMessages, userMessage]), errorMessage]
      setCurrentMessages(updatedMessages)
      
      // Update the chat with the error message
      setActiveChats(prev => prev.map(chat => 
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

  const handleSelectChat = async (chatId: string) => {
    console.log('handleSelectChat called with chatId:', chatId)
    console.log('User authenticated:', !!user)
    
    const activeChats = user ? chats : tempChats
    
    // Close preview pane when switching chats
    setIsPreviewOpen(false)
    
    try {
      if (user && !chatId.startsWith('temp_')) {
        console.log('Loading chat from database for authenticated user')
        // Load chat from database for authenticated users
        const selectedChat = await ChatService.getChatById(chatId)
        console.log('Selected chat from database:', selectedChat ? 'found' : 'not found')
        
        if (selectedChat) {
          console.log('Setting selected chat state - messages count:', selectedChat.messages?.length || 0)
          setSelectedChatId(chatId)
          setCurrentMessages(selectedChat.messages || [])
          
          // Update local chats array
          setChats(prev => prev.map(chat => 
            chat.id === chatId ? selectedChat : chat
          ))
        } else {
          console.error('Failed to load chat from database')
        }
      } else {
        console.log('Loading chat from local state')
        // Load from local state for anonymous users
        const selectedChat = activeChats.find(chat => chat.id === chatId)
        console.log('Selected chat from local state:', selectedChat ? 'found' : 'not found')
        
        if (selectedChat) {
          console.log('Setting selected chat state - messages count:', selectedChat.messages?.length || 0)
          setSelectedChatId(chatId)
          setCurrentMessages(selectedChat.messages || [])
        } else {
          console.error('Chat not found in local state')
        }
      }
    } catch (error) {
      console.error('Error in handleSelectChat:', error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    const setActiveChats = user ? setChats : setTempChats
    
    if (user && !chatId.startsWith('temp_')) {
      // Delete from database for authenticated users
      const success = await ChatService.deleteChat(chatId)
      
      if (!success) {
        console.error('Failed to delete chat')
        return
      }
    }

    // Remove chat from local state
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId))
    
    // If the deleted chat was selected, clear selection
    if (selectedChatId === chatId) {
      setSelectedChatId(null)
      setCurrentMessages([])
    }
  }

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    const setActiveChats = user ? setChats : setTempChats
    
    if (user && !chatId.startsWith('temp_')) {
      // Update in database for authenticated users
      const success = await ChatService.updateChatTitle(chatId, newTitle)
      
      if (!success) {
        console.error('Failed to rename chat')
        return
      }
    }

    // Update local state
    setActiveChats(prev => prev.map(chat => 
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
  }

  const handleOpenPreview = (htmlContent?: string) => {
    if (htmlContent) {
      setPreviewHtmlContent(htmlContent)
      setIsPreviewOpen(true)
    } else if (previewHtmlContent) {
      setIsPreviewOpen(true)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Don't redirect - let user continue using the app anonymously
  }

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show appropriate chats based on authentication status
  const displayChats = user ? chats : tempChats

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        className={cn(
          "hidden lg:flex transition-all duration-300 ease-in-out border-r border-sidebar-border",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"
        )}
        chats={displayChats}
        selectedChatId={selectedChatId}
        onNewChat={handleNewChat} 
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header 
          onNewChat={handleNewChat} 
          onSelectChat={handleSelectChat}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
          chats={chats}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          user={user}
          onLogout={handleLogout}
          onOpenPreview={handleOpenPreview}
          hasPreviewContent={!!previewHtmlContent}
        />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <Messages 
            messages={currentMessages} 
            isLoading={isLoading}
            currentChatId={selectedChatId}
            className="h-full"
            onOpenPreview={handleOpenPreview}
            hasPreviewContent={!!previewHtmlContent}
            onSendMessage={handleSendMessage}
          />
        </div>
        

        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          className="flex-shrink-0"
        />
      </div>

      {/* Preview Pane - Right side */}
      {isPreviewOpen && previewHtmlContent && (
        <PreviewPane
          htmlContent={previewHtmlContent}
          onClose={handleClosePreview}
          isOpen={isPreviewOpen}
          className="w-80 lg:w-96 border-l border-sidebar-border"
        />
      )}
    </div>
  )
}
