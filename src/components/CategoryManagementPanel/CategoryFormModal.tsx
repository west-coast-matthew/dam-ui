import { useState, type FormEvent } from 'react'
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH } from '../../services/categoryService'
import { Button, TextArea, TextField } from '../FormControls'
import { Modal } from '../Modal'

export interface NewCategory {
  name: string
  description: string
}

export interface CategoryFormModalProps {
  /** Name of the parent category, or null for a top-level category. */
  parentName: string | null
  /** Returns an error message when the name can't be used (e.g. a sibling already has it). */
  validateName: (name: string) => string | undefined
  onCancel: () => void
  onSubmit: (category: NewCategory) => void
}

/** Collects the title and optional description of a new category. Nothing is saved until the panel's Save. */
export function CategoryFormModal({ parentName, validateName, onCancel, onSubmit }: CategoryFormModalProps) {
  const [input, setInput] = useState<NewCategory>({ name: '', description: '' })
  const [attempted, setAttempted] = useState(false)
  const error = (name: string) => (name.trim() ? validateName(name) : 'Enter a title.')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (error(input.name)) return
    onSubmit({ name: input.name.trim(), description: input.description.trim() })
  }

  const formId = 'cm-category-form'
  return (
    <Modal
      open
      size="sm"
      title={parentName ? `New category in ${parentName}` : 'New top-level category'}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" form={formId}>Add category</Button>
        </>
      }
    >
      <form id={formId} className="cm-form" onSubmit={submit} noValidate>
        <TextField label="Title" required autoFocus autoComplete="off" value={input.name}
          error={attempted ? error(input.name) : undefined} maxLength={CATEGORY_NAME_MAX_LENGTH}
          placeholder="e.g. Product photography"
          onChange={(e) => setInput((i) => ({ ...i, name: e.target.value }))} />
        <TextArea label="Description" value={input.description} maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
          hint="Optional. Shown when someone hovers over the category."
          onChange={(e) => setInput((i) => ({ ...i, description: e.target.value }))} />
        <p className="cm-form__note">The category is added to your pending changes. Choose Save changes to keep it.</p>
      </form>
    </Modal>
  )
}
