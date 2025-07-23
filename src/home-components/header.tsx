import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  className?: string
  onNewChat?: () => void
  onSelectChat?: (chatId: string) => void
}

export function Header({ className, onNewChat, onSelectChat }: HeaderProps) {
  return (
    <header 
      className={cn(
        "flex justify-between items-center px-4 lg:px-6 py-4 border-b border-border bg-card",
        className
      )}
    >
      <MobileMenu onNewChat={onNewChat} onSelectChat={onSelectChat} />
      
      <div className="flex-1 flex justify-center lg:justify-center">
        <div className="text-lg font-semibold tracking-wide text-foreground">
          Zynex AI Studio
        </div>
      </div>
      
      {/* Theme Toggle */}
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  )
}
