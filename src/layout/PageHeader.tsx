import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: ReactNode
}

/** Title (and optional description) at the top of an app page. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  )
}
