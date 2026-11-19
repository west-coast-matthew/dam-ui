import { useState, type FormEvent } from 'react'
import { Button, TextArea, TextField } from '../FormControls'
import { Modal } from '../Modal'
import {
  WORKSPACE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_NAME_MAX_LENGTH,
  type WorkspaceInput,
  type WorkspaceRecord,
} from '../../services/workspaceService'
import { errorMessage } from './format'
import { useSaveWorkspace } from './useWorkspaces'

export interface WorkspaceFormModalProps {
  /** 'new' opens an empty form; a workspace opens it for editing; null closes it. */
  target: WorkspaceRecord | 'new' | null
  /** Every workspace, to catch duplicate names before the round trip. */
  existing: WorkspaceRecord[]
  onClose: () => void
  onSaved: (workspace: WorkspaceRecord) => void
}

function validate(input: WorkspaceInput, existing: WorkspaceRecord[], ownId?: string) {
  const name = input.name.trim()
  return {
    name: !name
      ? 'Enter a name.'
      : existing.some((w) => w.id !== ownId && w.name.toLowerCase() === name.toLowerCase())
        ? 'A workspace with this name already exists.'
        : undefined,
  }
}

/** Create and edit share this form; the wrapper remounts it (by key) for each workspace. */
function WorkspaceForm({ target, existing, onClose, onSaved }: Omit<WorkspaceFormModalProps, 'target'> & { target: WorkspaceRecord | 'new' }) {
  const editing = target !== 'new'
  const [input, setInput] = useState<WorkspaceInput>(
    editing ? { name: target.name, description: target.description } : { name: '', description: '' },
  )
  const [attempted, setAttempted] = useState(false)
  const save = useSaveWorkspace()
  const ownId = editing ? target.id : undefined
  const errors: Partial<ReturnType<typeof validate>> = attempted ? validate(input, existing, ownId) : {}
  const unchanged = editing && input.name.trim() === target.name && input.description.trim() === target.description

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (Object.values(validate(input, existing, ownId)).some(Boolean) || save.isPending) return
    save.mutate({ id: ownId, input }, { onSuccess: onSaved })
  }

  const formId = 'wm-workspace-form'
  return (
    <Modal
      open
      title={editing ? `Edit ${target.name}` : 'New workspace'}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="submit" form={formId} loading={save.isPending} disabled={unchanged}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create workspace'}
          </Button>
        </>
      }
    >
      <form id={formId} className="wm-form" onSubmit={submit} noValidate>
        {save.isError && <p className="wm-form__error" role="alert">{errorMessage(save.error)}</p>}
        <fieldset className="wm-form__fields" disabled={save.isPending}>
          <legend className="fc-visually-hidden">Workspace details</legend>
          <TextField label="Name" required autoFocus value={input.name} error={errors.name}
            placeholder="e.g. Marketing" autoComplete="off" maxLength={WORKSPACE_NAME_MAX_LENGTH}
            onChange={(e) => setInput((i) => ({ ...i, name: e.target.value }))} />
          <TextArea label="Description" value={input.description}
            hint="Optional. What this workspace is for and who uses it."
            maxLength={WORKSPACE_DESCRIPTION_MAX_LENGTH}
            onChange={(e) => setInput((i) => ({ ...i, description: e.target.value }))} />
        </fieldset>
      </form>
    </Modal>
  )
}

export function WorkspaceFormModal(props: WorkspaceFormModalProps) {
  if (!props.target) return null
  const { target } = props
  return <WorkspaceForm key={target === 'new' ? 'new' : target.id} {...props} target={target} />
}
