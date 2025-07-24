import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      description="No worries, we'll send you reset instructions"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
