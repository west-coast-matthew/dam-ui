import { Button } from '../FormControls'
import { Modal } from '../Modal'
import type { TreeNode } from '../TreeControl'

export interface DeleteCategoryModalProps {
  /** The category to delete. */
  node: TreeNode
  /** Name of the catalog's default category, where orphaned assets go. */
  defaultName: string
  onCancel: () => void
  onConfirm: () => void
}

/** Subcategories below a node, and the assets in it and them. */
function contentsOf(node: TreeNode): { categories: number; assets: number } {
  const total = { categories: 0, assets: node.count ?? 0 }
  const walk = (list: TreeNode[]) =>
    list.forEach((n) => {
      total.categories += 1
      total.assets += n.count ?? 0
      if (n.children) walk(n.children)
    })
  walk(node.children ?? [])
  return total
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/** Confirms deleting a category with everything inside it. */
export function DeleteCategoryModal({ node, defaultName, onCancel, onConfirm }: DeleteCategoryModalProps) {
  const inside = contentsOf(node)
  const detail = inside.categories > 0
    ? <>This deletes <strong>{node.label}</strong> and the {plural(inside.categories, 'category', 'categories')} inside it.</>
    : <>This deletes the category <strong>{node.label}</strong>.</>

  return (
    <Modal
      open
      size="sm"
      title={`Delete ${node.label}?`}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} autoFocus>Keep category</Button>
          <Button variant="danger" onClick={onConfirm}>Delete category</Button>
        </>
      }
    >
      <p className="cm-confirm">{detail}</p>
      {inside.assets > 0 && (
        <p className="cm-confirm cm-confirm--warning">
          {inside.categories > 0 ? 'They hold' : 'It holds'} {plural(inside.assets, 'asset', 'assets')}. The assets aren't deleted:
          any left without a category move to {defaultName}.
        </p>
      )}
      <p className="cm-confirm cm-confirm--muted">
        Nothing is removed until you save changes, and you can still cancel them before then. Once saved, it can't be undone.
      </p>
    </Modal>
  )
}
