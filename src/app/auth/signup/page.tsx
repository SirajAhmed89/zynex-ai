import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Join Zynex AI Studio to get started"
    >
      <SignupForm />
    </AuthLayout>
  )
}
