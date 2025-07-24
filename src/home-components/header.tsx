import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelLeftClose } from "lucide-react"
import type { Chat } from "./homepage"

interface HeaderProps {
  className?: string
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  chats?: Chat[]
  onDeleteChat?: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
}

export function Header({ className, onNewChat, onSelectChat, onToggleSidebar, isSidebarOpen, chats, onDeleteChat, onRenameChat }: HeaderProps) {
  return (
    <header 
      className={cn(
        "flex justify-between items-center px-4 lg:px-6 py-4 border-b bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 hidden lg:flex"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        
        <MobileMenu 
          onNewChat={onNewChat} 
          onSelectChat={onSelectChat}
          chats={chats}
          onDeleteChat={onDeleteChat}
          onRenameChat={onRenameChat}
        />
      </div>
      
      <div className="flex-1 flex justify-center lg:justify-center">
        <div className="text-lg font-semibold tracking-wide text-foreground">
          Zynex AI
        </div>
      </div>
      
      {/* Theme Toggle */}
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  )
}
