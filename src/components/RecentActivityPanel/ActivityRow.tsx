import type { ReactNode } from 'react'
import { fullDate, timeAgo } from './format'

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'negative' | 'pending'

export interface ActivityRowProps {
  leading: ReactNode
  primary: ReactNode
  secondary: ReactNode
  badge?: { label: string; tone: BadgeTone }
  /** ISO date-time shown as "5 minutes ago". */
  time: string
  now: number
  /** Accessible name for the row's button. */
  label: string
  onOpen?: () => void
}

/** One line in an activity list. It's a button when the parent handles opening items. */
export function ActivityRow({ leading, primary, secondary, badge, time, now, label, onOpen }: ActivityRowProps) {
  const content = (
    <>
      <span className="rap-row__leading">{leading}</span>
      <span className="rap-row__main">
        <span className="rap-row__primary">{primary}</span>
        <span className="rap-row__secondary">{secondary}</span>
      </span>
      <span className="rap-row__trailing">
        {badge && <span className={`rap-badge rap-badge--${badge.tone}`}>{badge.label}</span>}
        <time className="rap-row__time" dateTime={time} title={fullDate(time)}>{timeAgo(time, now)}</time>
      </span>
    </>
  )
  return (
    <li>
      {onOpen ? (
        <button type="button" className="rap-row rap-row--interactive" aria-label={label} onClick={onOpen}>
          {content}
        </button>
      ) : (
        <div className="rap-row">{content}</div>
      )}
    </li>
  )
}
