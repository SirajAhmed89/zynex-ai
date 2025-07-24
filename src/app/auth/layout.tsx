import { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayoutWrapper({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
