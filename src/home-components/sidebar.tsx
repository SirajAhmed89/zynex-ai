"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Search, Clock, User, Settings, MoreHorizontal, Edit2, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Chat } from "./homepage"

interface SidebarProps {
  className?: string
  chats?: Chat[]
  selectedChatId?: string | null
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
  onDeleteChat?: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
  isOpen?: boolean
  onToggle?: () => void
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  return `${Math.floor(diffInSeconds / 2592000)} months ago`
}

export function Sidebar({ className, chats = [], selectedChatId, onNewChat, onSelectChat, onDeleteChat, onRenameChat }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  // Sort chats by most recent first
  const sortedChats = [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  
  const filteredChats = sortedChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatSelect = (chatId: string) => {
    if (editingChatId === chatId) return // Prevent selection while editing
    onSelectChat?.(chatId)
  }

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat?.(chatId)
  }

  const handleRenameStart = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
  }

  const handleRenameCancel = () => {
    setEditingChatId(null)
    setEditingTitle("")
  }

  const handleRenameSave = () => {
    if (editingChatId && editingTitle.trim()) {
      onRenameChat?.(editingChatId, editingTitle.trim())
    }
    setEditingChatId(null)
    setEditingTitle("")
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  return (
    <aside className={cn(
      "w-64 bg-sidebar flex flex-col h-full",
      className
    )}>
      {/* Header */}
      <div className="bg-card">
        {/* Logo & Brand Section */}
        <div className="px-4 lg:px-6 py-2">
          <div className="flex items-center justify-center py-1.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Zynex AI Logo"
                  width={38}
                  height={38}
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Zynex AI
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Intelligent Assistant
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Separator Line - Full Width */}
        <div className="border-b border-border"></div>
        
        {/* Controls Section */}
        <div className="px-4 lg:px-6 py-4 space-y-4">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-3 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="w-4 h-4 bg-white/20 rounded-sm flex items-center justify-center">
              <Plus className="h-3 w-3" />
            </div>
            New chat
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-muted/50 border-border/50 focus:border-primary/50 focus:bg-background rounded-lg transition-all duration-200 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            <Clock className="h-3 w-3" />
            Recent Chats
          </div>
          
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border border-transparent",
                "hover:bg-sidebar-accent/70 hover:border-border/30",
                selectedChatId === chat.id && "bg-sidebar-accent border-border/40 shadow-sm",
                editingChatId !== chat.id && "cursor-pointer"
              )}
              onClick={() => editingChatId !== chat.id && handleChatSelect(chat.id)}
            >
              <div className="flex-1 min-w-0">
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      className="h-8 text-sm font-medium text-sidebar-foreground"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRenameSave()
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRenameCancel()
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-sidebar-foreground truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(chat.updatedAt)}
                    </div>
                  </>
                )}
              </div>
              
              {editingChatId !== chat.id && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 shadow-lg border-border/50">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRenameStart(chat.id, chat.title)
                        }}
                        className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="font-medium">Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChat(chat.id)
                        }}
                        className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="font-medium">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
          
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm mb-2">No chats yet</div>
              <div className="text-xs">Start a conversation with Zynex!</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm mb-2">No chats found</div>
              <div className="text-xs">Try a different search term</div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between p-4 bg-sidebar-accent m-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                User
              </span>
              <span className="text-xs text-muted-foreground">
                Free Plan
              </span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
