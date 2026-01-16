import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { SignupForm } from '@/components/auth/SignupForm'

const SignupPage = async (): Promise<React.JSX.Element> => {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-8">
      <SignupForm />
    </div>
  )
}

export default SignupPage
