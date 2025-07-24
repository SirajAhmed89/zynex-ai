"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthInput } from "./auth-input"
import { Mail, Lock, User, Loader2 } from "lucide-react"
import { supabaseClient as supabase } from "@/lib/supabase-client"

interface SignupFormData {
  name: string
  email: string
  password: string
}

interface SignupFormErrors {
  name?: string
  email?: string
  password?: string
  general?: string
}

export function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: SignupFormErrors = {}

    if (!formData.name) {
      newErrors.name = "Name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
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
      const { email, password } = formData;
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrors({ general: error.message });
        return;
      }

      // Success - redirect to homepage
      window.location.href = "/";
      
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
    if (errors[name as keyof SignupFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Fields */}
      <div className="space-y-4">
        <AuthInput
          id="name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={<User className="h-4 w-4" />}
          disabled={isLoading}
          required
        />

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

        <AuthInput
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
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
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary hover:underline font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  )
}
