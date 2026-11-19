export function ScreenStatus({
  children,
  error,
}: {
  children: string
  error?: boolean
}) {
  return (
    <p
      className={`my-2.5${error ? 'text-sm text-destructive' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
