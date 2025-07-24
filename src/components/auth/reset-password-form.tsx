"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthInput } from "./auth-input"
import { Lock, Loader2, CheckCircle } from "lucide-react"

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

interface ResetPasswordFormErrors {
  password?: string
  confirmPassword?: string
  general?: string
}

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordFormErrors = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // TODO: Replace with actual reset password logic
      console.log("Reset password attempt:", { password: formData.password, token })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo, check if token exists (in real app, validate on server)
      if (!token) {
        setErrors({ general: "Invalid or expired reset token. Please request a new password reset." })
        return
      }
      
      setIsSuccess(true)
      
    } catch {
      setErrors({ general: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear specific field error when user starts typing
    if (errors[name as keyof ResetPasswordFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Password reset successful</h3>
          <p className="text-muted-foreground text-sm">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/auth/login">
            Continue to sign in
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <AuthInput
            id="password"
            name="password"
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock className="h-4 w-4" />}
            disabled={isLoading}
            required
          />
          
          {formData.password && (
            <div className="space-y-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-2 w-full rounded-full ${
                      level <= passwordStrength
                        ? passwordStrength <= 2
                          ? "bg-red-500"
                          : passwordStrength <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: {
                  passwordStrength <= 2 ? "Weak" : 
                  passwordStrength <= 3 ? "Medium" : 
                  "Strong"
                }
              </p>
            </div>
          )}
        </div>

        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<Lock className="h-4 w-4" />}
          disabled={isLoading}
          required
        />

        {errors.general && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.general}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 font-medium"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Updating password..." : "Update password"}
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-primary hover:underline transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
