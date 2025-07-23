"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"

interface MobileMenuProps {
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
}

export function MobileMenu({ onNewChat, onSelectChat }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleNewChat = () => {
    onNewChat?.()
    setIsOpen(false)
  }

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              className="h-full shadow-lg"
            />
          </div>
        </>
      )}
    </>
  )
}
