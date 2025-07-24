"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your new password below"
    >
      <ResetPasswordForm token={token || undefined} />
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
