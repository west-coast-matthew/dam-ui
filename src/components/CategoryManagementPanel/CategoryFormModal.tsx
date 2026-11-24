import { useState, type FormEvent } from 'react'
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH } from '../../services/categoryService'
import { Button, TextArea, TextField } from '../FormControls'
import { Modal } from '../Modal'

export interface CategoryFields {
  name: string
  description: string
}

export interface CategoryFormModalProps {
  /** Present when editing an existing node; absent when creating one. */
  initial?: CategoryFields
  /** Name of the category a new node goes into, or null for the top level. Unused when editing. */
  parentName?: string | null
  /** Returns an error message when the name can't be used (e.g. a sibling already has it). */
  validateName: (name: string) => string | undefined
  onCancel: () => void
  onSubmit: (fields: CategoryFields) => void
}

const noun = 'category'

/**
 * Collects the title and optional description of a category, for a new one or an existing one.
 * Nothing is saved until the panel's Save changes.
 */
export function CategoryFormModal({ initial, parentName, validateName, onCancel, onSubmit }: CategoryFormModalProps) {
  const editing = initial !== undefined
  const [input, setInput] = useState<CategoryFields>(initial ?? { name: '', description: '' })
  const [attempted, setAttempted] = useState(false)
  const error = (name: string) => (name.trim() ? validateName(name) : 'Enter a title.')
  const unchanged = editing && input.name.trim() === initial.name && input.description.trim() === initial.description

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (error(input.name)) return
    onSubmit({ name: input.name.trim(), description: input.description.trim() })
  }

  let title: string
  if (editing) title = `Edit ${initial.name}`
  else if (parentName) title = `New ${noun} in ${parentName}`
  else title = `New top-level ${noun}`

  const formId = 'cm-category-form'
  return (
    <Modal
      open
      size="sm"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" form={formId} disabled={unchanged}>{editing ? 'Apply' : `Add ${noun}`}</Button>
        </>
      }
    >
      <form id={formId} className="cm-form" onSubmit={submit} noValidate>
        <TextField label="Title" required autoFocus autoComplete="off" value={input.name}
          error={attempted ? error(input.name) : undefined} maxLength={CATEGORY_NAME_MAX_LENGTH}
          placeholder="e.g. Animals"
          onChange={(e) => setInput((i) => ({ ...i, name: e.target.value }))} />
        <TextArea label="Description" value={input.description} maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
          hint={`Optional. Shown when someone hovers over the ${noun}.`}
          onChange={(e) => setInput((i) => ({ ...i, description: e.target.value }))} />
        <p className="cm-form__note">
          This goes into your pending changes. Choose Save changes to keep it.
        </p>
      </form>
    </Modal>
  )
}
