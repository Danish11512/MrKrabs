import { LoginForm } from '@/components/auth/LoginForm'

const LoginPage = (): React.JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-8">
      <LoginForm />
    </div>
  )
}

export default LoginPage
