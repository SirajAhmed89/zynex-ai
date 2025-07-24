import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelLeftClose } from "lucide-react"
import Link from "next/link"
import type { Chat } from "./homepage"
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  className?: string
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  chats?: Chat[]
  onDeleteChat?: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
  user?: SupabaseUser | null
  onLogout?: () => void
  onOpenPreview?: () => void
  hasPreviewContent?: boolean
}

export function Header({ className, onNewChat, onSelectChat, onToggleSidebar, isSidebarOpen, chats, onDeleteChat, onRenameChat, user }: HeaderProps) {
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
      
      <div className={cn(
        "flex-1 flex justify-center transition-all duration-300",
        // On desktop, when sidebar is open, offset the logo slightly to account for sidebar toggle button
        // When sidebar is closed, center perfectly
        isSidebarOpen ? "lg:-ml-5" : "lg:ml-0"
      )}>
        <div className="text-lg font-semibold tracking-wide text-foreground">
          Zynex AI
        </div>
      </div>
      
      {/* Auth & Theme */}
      <div className="flex items-center gap-2">
        {!user && (
          <>
            <Button asChild variant="ghost" size="sm" className="text-sm">
              <Link href="/auth/login">
                Sign in
              </Link>
            </Button>
            <Button asChild size="sm" className="text-sm">
              <Link href="/auth/signup">
                Sign up
              </Link>
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
