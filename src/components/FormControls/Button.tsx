import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  /** Shows a spinner and blocks clicks. */
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...button
}: ButtonProps) {
  const iconOnly = !children
  return (
    <button
      type={type}
      className={['fc-button', `fc-button--${variant}`, `fc-button--${size}`, iconOnly && 'fc-button--icon', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...button}
    >
      {loading ? <span className="fc-spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}
