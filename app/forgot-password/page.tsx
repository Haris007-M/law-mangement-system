import AuthCard from '@/components/AuthCard'
import ForgotPasswordForm from '@/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  )
}
