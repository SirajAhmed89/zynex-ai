"use client"

import { forwardRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === "password"

    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <Input
            type={isPasswordType ? (showPassword ? "text" : "password") : type}
            className={cn(
              "h-11 transition-colors",
              icon && "pl-10",
              isPasswordType && "pr-12",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = "AuthInput"
