"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthInput } from "./auth-input"
import { Mail, Lock, Loader2 } from "lucide-react"
import { supabaseClient as supabase } from "@/lib/supabase-client"
import type { AuthResponse } from "@supabase/supabase-js"

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {}

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
    console.log('🚀 Login form submitted');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');
    setIsLoading(true)
    setErrors({})

    try {
      const { email, password } = formData;
      console.log('📧 Attempting login with email:', email.trim());
      console.log('🔐 Password length:', password.length);
      console.log('🔗 Supabase client status:', {
        clientExists: !!supabase,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'fallback used'
      });
      
      console.log('⏳ Calling supabase.auth.signInWithPassword...');
      
      // Add timeout to prevent infinite loading
      const loginPromise = supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout - please try again')), 30000)
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      const { data, error } = result as AuthResponse;
      
      console.log('📥 Supabase response received:', {
        hasData: !!data,
        hasError: !!error,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at
        } : null,
        session: data?.session ? {
          accessToken: data.session.access_token ? 'Present' : 'Missing',
          refreshToken: data.session.refresh_token ? 'Present' : 'Missing'
        } : null
      });
      
      if (error) {
        console.error('❌ Supabase auth error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Handle specific Supabase auth errors with user-friendly messages
        let errorMessage = error.message;
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
            break;
          case 'Too many requests':
            errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
            break;
          case 'User not found':
            errorMessage = 'No account found with this email address. Please check your email or sign up.';
            break;
          case 'signup_disabled':
            errorMessage = 'Authentication service is temporarily unavailable. Please try again later.';
            break;
          default:
            // Use the original error message if no specific case matches
            errorMessage = error.message;
        }
        
        setErrors({ general: errorMessage });
        return;
      }

      if (!data?.user || !data?.session) {
        console.error('❌ Login successful but no user/session data');
        setErrors({ general: 'Login failed. Please try again.' });
        return;
      }

      console.log('✅ Login successful! Redirecting to homepage...');
      
      // Use Next.js router for better handling in production
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure session is set
      
      // Force a full page reload to ensure auth state is properly initialized
      window.location.href = "/";
      
    } catch (error: unknown) {
      console.error('💥 Unexpected login error:', error);
      
      // Handle network or unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage?.includes('fetch') || errorMessage?.includes('network')) {
        setErrors({ general: "Network error. Please check your internet connection and try again." });
      } else if (errorMessage?.includes('timeout')) {
        setErrors({ general: "Login is taking longer than expected. Please try again." });
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      console.log('🏁 Login process completed, setting loading to false');
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear specific field error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Fields */}
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
          <div 
            className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md" 
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start space-x-2">
              <svg className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-input"
              disabled={isLoading}
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-primary hover:underline font-medium transition-colors"
        >
          Sign up
        </Link>
      </div>
    </form>
  )
}
