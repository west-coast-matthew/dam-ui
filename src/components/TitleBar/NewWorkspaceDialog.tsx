import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isApiEnabled } from '../../services/apiClient'
import { Button, TextField } from '../FormControls'

interface NewWorkspaceDialogProps {
  open: boolean
  existingNames: string[]
  /** Creates the workspace; a rejected promise keeps the dialog open and shows the error. */
  onCreate: (name: string) => Promise<void>
  onClose: () => void
}

function validateName(name: string, existing: string[]) {
  const trimmed = name.trim()
  if (!trimmed) return 'Enter a name.'
  if (trimmed.length > 40) return 'Use 40 characters or fewer.'
  if (existing.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return 'A workspace with this name already exists.'
  return undefined
}

/** Modal for naming a new workspace. Uses the native <dialog> for focus trapping and Escape. */
export function NewWorkspaceDialog({ open, existingNames, onCreate, onClose }: NewWorkspaceDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const error = (submitted ? validateName(name, existingNames) : undefined) ?? saveError ?? undefined

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setName('')
      setSubmitted(false)
      setSaveError(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setSaveError(null)
    if (saving || validateName(name, existingNames)) return
    setSaving(true)
    try {
      await onCreate(name.trim())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "The workspace couldn't be created.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="titlebar-dialog"
      aria-labelledby="new-workspace-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        <h2 id="new-workspace-title">New workspace</h2>
        <p className="titlebar-dialog__text">
          Workspaces keep assets, collections and people separate.{isApiEnabled() ? '' : ' (Mock: nothing is saved.)'}
        </p>
        <TextField label="Name" required autoFocus value={name} placeholder="e.g. Marketing"
          onChange={(e) => {
            setName(e.target.value)
            setSaveError(null)
          }} error={error} maxLength={60} />
        <div className="titlebar-dialog__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create workspace</Button>
        </div>
      </form>
    </dialog>
  )
}
