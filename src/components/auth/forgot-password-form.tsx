"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthInput } from "./auth-input"
import { Mail, Loader2, ArrowLeft } from "lucide-react"

interface ForgotPasswordFormData {
  email: string
}

interface ForgotPasswordFormErrors {
  email?: string
  general?: string
}

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  })
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordFormErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
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
      // TODO: Replace with actual forgot password logic
      console.log("Forgot password attempt:", formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
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
    if (errors[name as keyof ForgotPasswordFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-muted-foreground text-sm">
            We&apos;ve sent a password reset link to <strong>{formData.email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsSuccess(false)
              setFormData({ email: "" })
            }}
            className="w-full"
          >
            Try again
          </Button>
          
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-primary hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-4">
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={<Mail className="h-4 w-4" />}
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
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-primary hover:underline transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
