import AuthCard from "@/components/AuthCard"
import LoginForm from "@/components/LoginForm"
import { BRAND } from "@/lib/brand"

const MESSAGES: Record<string, string> = {
  inactive: "Your account is suspended. Contact your administrator.",
  noprofile: "No account profile found. Contact your administrator.",
  invalid_link: "That link is invalid or has expired. Request a new one.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthCard title="Sign in" subtitle={`Welcome back to ${BRAND.name}`}>
      {error && MESSAGES[error] && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">
          {MESSAGES[error]}
        </p>
      )}
      <LoginForm />
    </AuthCard>
  )
}
