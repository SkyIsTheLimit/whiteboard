import { notifyAuthChange } from '@/shared/api/auth-change'
import { Input } from '@/components/ui/input'
import { ArrowRight, GoogleLogo, Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { configQuery } from '@/shared/api/board-queries'
import { errorMessage } from '@/shared/api/boards-client'
import { authClient, localDestination } from '@/shared/api/auth-client'
import { Logo } from '@/shared/components/Logo'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/shared/hooks/useTheme'

const ThemeToggleButton = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      className={className}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Dark theme' : 'Light theme'}
    >
      {theme === 'light' ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </Button>
  )
}

export function AuthScreen({ returnTo }: { returnTo?: string }) {
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const client = useQueryClient()
  const { data: config } = useQuery(configQuery)
  const googleEnabled = config?.googleEnabled ?? false
  const { data: session } = authClient.useSession()
  const destination = localDestination(returnTo)

  useEffect(() => {
    if (session) window.location.replace(destination)
  }, [destination, session])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    setPending(true)
    setError('')
    try {
      const result = creating
        ? await authClient.signUp.email({ email, name, username, password })
        : await authClient.signIn.username({ username, password })
      if (result.error)
        throw new Error(
          result.error.message ?? 'Check your details and try again.',
        )
      client.clear()
      notifyAuthChange()
      window.location.replace(destination)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function google() {
    setPending(true)
    setError('')
    try {
      const { error: result } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: new URL(destination, window.location.origin).href,
      })
      if (result) throw new Error(result.message ?? 'Google sign in failed.')
    } catch (reason) {
      setError(errorMessage(reason))
      setPending(false)
    }
  }

  return (
    <main>
      <ThemeToggleButton className="absolute top-6 right-6 opacity-50 hover:opacity-100" />
      <div className="relative mx-auto my-8 w-[calc(100%-2rem)] max-w-md rounded-4xl border bg-background p-7 shadow-(--board-shadow) sm:my-16 lg:my-20">
        <Logo
          size="6rem"
          className="mx-auto mb-3 rounded-3xl border border-border/20"
        />
        <div className="absolute top-6 right-6"></div>
        <h1 className="mb-4 text-xl text-muted-foreground/80">
          {creating ? 'Create your account' : 'Welcome, please sign in'}
        </h1>
        <form className="grid gap-3" onSubmit={submit}>
          {creating && (
            <label className="grid gap-1.5 text-sm text-muted-foreground/50">
              Name
              <Input
                className="text-foreground"
                required
                name="name"
                autoComplete="name"
                maxLength={100}
              />
            </label>
          )}
          {creating && (
            <label className="grid gap-1.5 text-sm text-muted-foreground/50">
              Email
              <Input
                className="text-foreground"
                required
                name="email"
                type="email"
                autoComplete="email"
              />
            </label>
          )}
          <label className="grid gap-1.5 text-sm text-muted-foreground/50">
            Username
            <Input
              className="text-foreground"
              required
              name="username"
              autoComplete="username"
              minLength={creating ? 3 : undefined}
              maxLength={30}
            />
          </label>
          <label className="grid gap-1.5 text-sm text-muted-foreground/50">
            Password
            <Input
              className="text-foreground"
              required
              name="password"
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              minLength={creating ? 8 : undefined}
              maxLength={128}
            />
          </label>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" type="submit" disabled={pending}>
            {creating ? 'Create account' : 'Sign in'}{' '}
            <ArrowRight className="size-4.5" />
          </Button>
        </form>
        {googleEnabled && (
          <div className="mt-2.5 grid">
            <Button
              variant="outline"
              size="lg"
              onClick={google}
              disabled={pending}
            >
              <GoogleLogo className="size-4.5" /> Continue with Google
            </Button>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground/70">
          {creating ? 'Already have an account?' : 'New to Whiteboard?'}{' '}
          <Button
            variant="link"
            size="xs"
            onClick={() => {
              setCreating(!creating)
              setError('')
            }}
            disabled={pending}
          >
            {creating ? 'Sign in' : 'Create an account'}
          </Button>
        </p>
      </div>
    </main>
  )
}
