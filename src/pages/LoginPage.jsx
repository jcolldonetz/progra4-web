import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/authStore'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <LoginForm onSuccess={() => navigate('/')} />
    </div>
  )
}