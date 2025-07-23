"use client"

import { useState } from "react"
import { Plus, Search, Clock, User, Settings, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Chat } from "./homepage"

interface SidebarProps {
  className?: string
  chats?: Chat[]
  selectedChatId?: string | null
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
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

export function Sidebar({ className, chats = [], selectedChatId, onNewChat, onSelectChat }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Sort chats by most recent first
  const sortedChats = [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  
  const filteredChats = sortedChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatSelect = (chatId: string) => {
    onSelectChat?.(chatId)
  }

  return (
    <aside className={cn(
      "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full",
      className
    )}>
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-sidebar-border">
        <Button 
          onClick={onNewChat}
          className="w-full justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border focus:border-sidebar-ring"
          />
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
              onClick={() => handleChatSelect(chat.id)}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-sidebar-accent",
                selectedChatId === chat.id && "bg-sidebar-accent"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(chat.updatedAt)}
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-sidebar-foreground"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
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
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between p-3 bg-sidebar-accent rounded-lg">
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
