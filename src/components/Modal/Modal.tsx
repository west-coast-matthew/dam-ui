import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '../FormControls'
import './Modal.css'

export interface ModalProps {
  open: boolean
  title: ReactNode
  /** Called on Escape, the close button or a click on the backdrop (unless dismissible is false). */
  onClose: () => void
  children: ReactNode
  /** Buttons along the bottom. */
  footer?: ReactNode
  size?: 'sm' | 'md'
  /** False while something is in progress, so the modal can't be closed mid-save. */
  dismissible?: boolean
}

/** Modal dialog built on the native <dialog>, which handles focus trapping and Escape. */
export function Modal({ open, title, onClose, children, footer, size = 'md', dismissible = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Escape: let the parent decide, so the dialog's open state stays in sync with React.
        e.preventDefault()
        if (dismissible) onClose()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget && dismissible) onClose()
      }}
    >
      {open && (
        <div className="modal__inner">
          <header className="modal__header">
            <h2 id={titleId} className="modal__title">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close"
              disabled={!dismissible}
              onClick={onClose}
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              }
            />
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
