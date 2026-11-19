export function Logo({
  size = 24,
  className,
}: {
  size?: number | string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M10 17l12 5.5-5.5 2.7-2.6 6.3z"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="fill-foreground stroke-foreground"
      />
      <path
        d="M27 17l12 5.5-5.5 2.7-2.6 6.3z"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="fill-primary stroke-primary"
      />
    </svg>
  )
}
