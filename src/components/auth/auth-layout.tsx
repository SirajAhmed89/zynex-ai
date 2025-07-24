"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
  showBackLink?: boolean
}

export function AuthLayout({ children, title, description, showBackLink = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {showBackLink && (
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>
        )}
        
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-primary-foreground" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            © 2024 Zynex AI Studio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
