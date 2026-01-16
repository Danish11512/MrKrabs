import { LoginForm } from '@/components/auth/LoginForm'

const LoginPage = (): React.JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}

export default LoginPage
