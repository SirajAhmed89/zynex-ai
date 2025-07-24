"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import type { Chat } from "./homepage"

interface MobileMenuProps {
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
  chats?: Chat[]
  onDeleteChat?: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
}

export function MobileMenu({ onNewChat, onSelectChat, chats, onDeleteChat, onRenameChat }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile menu when window resizes to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNewChat = () => {
    onNewChat?.()
    setIsOpen(false)
  }

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId)
    setIsOpen(false)
  }

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat?.(chatId)
    // Don't close menu on delete to allow multiple operations
  }

  const handleRenameChat = (chatId: string, newTitle: string) => {
    onRenameChat?.(chatId, newTitle)
    // Don't close menu on rename to allow multiple operations
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]">
            <Sidebar
              chats={chats}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              className="h-full shadow-2xl border-r-0"
            />
          </div>
        </>
      )}
    </>
  )
}
