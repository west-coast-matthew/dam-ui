import type { ReactNode } from 'react'
import { Button } from '../FormControls'
import { Modal } from '../Modal'

export interface ConfirmModalProps {
  title: string
  children: ReactNode
  confirmLabel: string
  pendingLabel?: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
  /** Shown inline when the action failed; the dialog stays open. */
  error?: string | null
}

/** Asks before a destructive action (clear, delete). Render it only while it's open. */
export function ConfirmModal({ title, children, confirmLabel, pendingLabel, onConfirm, onCancel, pending = false, error }: ConfirmModalProps) {
  return (
    <Modal
      open
      size="sm"
      title={title}
      onClose={onCancel}
      dismissible={!pending}
      footer={
        <>
          <Button variant="ghost" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button variant="danger" loading={pending} onClick={onConfirm} autoFocus>
            {pending ? pendingLabel ?? confirmLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="lbx-confirm">
        {children}
        {error && <p className="lbx-error" role="alert">{error}</p>}
      </div>
    </Modal>
  )
}
