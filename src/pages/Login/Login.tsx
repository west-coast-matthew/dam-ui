import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button, TextField } from '../../components/FormControls'
import { ThemeSelect } from '../../components/ThemeSelect'
import { TitleBarIcon } from '../../components/TitleBar/icons'
import { InvalidCredentialsError } from '../../services/authService'
import './Login.css'

const DEFAULT_DESTINATION = '/dashboard'

/** Where to go after signing in: the page the user was sent here from, if it's a safe in-app path. */
function destinationFrom(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')
    ? from
    : DEFAULT_DESTINATION
}

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

/** Sign-in screen. Credentials are checked by the (mock) auth service. */
export function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user && !submitting) return <Navigate to={destinationFrom(location.state)} replace />

  const usernameError = attempted && !username.trim() ? 'Enter your user name.' : undefined
  const passwordError = attempted && !password ? 'Enter your password.' : undefined

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    setError(null)
    if (!username.trim() || !password || submitting) return
    setSubmitting(true)
    try {
      await signIn(username, password)
      navigate(destinationFrom(location.state), { replace: true })
    } catch (err) {
      setError(err instanceof InvalidCredentialsError ? err.message : 'Sign in failed. Please try again.')
      // Clear the password, and the field-level "required" errors, so only the banner shows.
      setPassword('')
      setAttempted(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__theme">
        <ThemeSelect />
      </div>
      <main className="login__card">
        <div className="login__brand">
          <span className="login__logo" aria-hidden="true">
            <TitleBarIcon name="layers" size={24} />
          </span>
          <span className="login__product">Digital Asset Management</span>
        </div>
        <h1 className="login__title">Sign in</h1>
        <p className="login__subtitle">Welcome back. Sign in to your workspace.</p>

        <form className="login__form" onSubmit={onSubmit} noValidate>
          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}
          <TextField
            label="User name"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
            value={username}
            error={usernameError}
            disabled={submitting}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            error={passwordError}
            disabled={submitting}
            onChange={(e) => setPassword(e.target.value)}
            suffix={
              <button
                type="button"
                className="login__reveal"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((s) => !s)}
              >
                <EyeIcon off={showPassword} />
              </button>
            }
          />
          <Button type="submit" size="lg" className="login__submit" loading={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </main>
    </div>
  )
}
