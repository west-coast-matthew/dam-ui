import { Button } from '../FormControls'
import { Modal } from '../Modal'
import { descendantCount, type TreeNode } from '../TreeControl'

export interface DeleteCategoryModalProps {
  category: TreeNode
  onCancel: () => void
  onConfirm: () => void
}

/** Confirms deleting a category and everything below it. */
export function DeleteCategoryModal({ category, onCancel, onConfirm }: DeleteCategoryModalProps) {
  const below = descendantCount(category)
  return (
    <Modal
      open
      size="sm"
      title={`Delete ${category.label}?`}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} autoFocus>Keep category</Button>
          <Button variant="danger" onClick={onConfirm}>Delete category</Button>
        </>
      }
    >
      <p className="cm-confirm">
        {below > 0
          ? <>This deletes <strong>{category.label}</strong> and the {below} {below === 1 ? 'category' : 'categories'} inside it.</>
          : <>This deletes <strong>{category.label}</strong>.</>}
      </p>
      <p className="cm-confirm cm-confirm--muted">
        Nothing is removed until you save changes, and you can still cancel them before then. Once saved, it can't be undone.
      </p>
    </Modal>
  )
}
