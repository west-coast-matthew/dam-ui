import { Button } from '../FormControls'
import { Modal } from '../Modal'
import type { TreeNode } from '../TreeControl'

export interface DeleteCategoryModalProps {
  /** The category or asset bucket to delete. */
  node: TreeNode
  onCancel: () => void
  onConfirm: () => void
}

interface Contents {
  categories: number
  buckets: number
  assets: number
}

/** What sits below a node: categories, asset buckets, and the assets in those buckets. */
function contentsOf(node: TreeNode): Contents {
  const total: Contents = { categories: 0, buckets: 0, assets: 0 }
  const walk = (list: TreeNode[]) =>
    list.forEach((n) => {
      if (n.type === 'assetBucket') {
        total.buckets += 1
        total.assets += n.count ?? 0
      } else {
        total.categories += 1
      }
      if (n.children) walk(n.children)
    })
  walk(node.children ?? [])
  return total
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/** Confirms deleting a category (with everything inside it) or an asset bucket. */
export function DeleteCategoryModal({ node, onCancel, onConfirm }: DeleteCategoryModalProps) {
  const bucket = node.type === 'assetBucket'
  const noun = bucket ? 'asset bucket' : 'category'

  let detail
  let assets: number
  if (bucket) {
    assets = node.count ?? 0
    detail = <>This deletes the asset bucket <strong>{node.label}</strong>.</>
  } else {
    const inside = contentsOf(node)
    assets = inside.assets
    const parts = [
      inside.categories > 0 && plural(inside.categories, 'category', 'categories'),
      inside.buckets > 0 && plural(inside.buckets, 'asset bucket', 'asset buckets'),
    ].filter(Boolean)
    detail = parts.length
      ? <>This deletes <strong>{node.label}</strong> and the {parts.join(' and ')} inside it.</>
      : <>This deletes the category <strong>{node.label}</strong>.</>
  }

  return (
    <Modal
      open
      size="sm"
      title={`Delete ${node.label}?`}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} autoFocus>Keep {noun}</Button>
          <Button variant="danger" onClick={onConfirm}>Delete {noun}</Button>
        </>
      }
    >
      <p className="cm-confirm">{detail}</p>
      {assets > 0 && (
        <p className="cm-confirm cm-confirm--warning">
          {bucket ? 'It holds' : 'Those asset buckets hold'} {plural(assets, 'asset', 'assets')}.
        </p>
      )}
      <p className="cm-confirm cm-confirm--muted">
        Nothing is removed until you save changes, and you can still cancel them before then. Once saved, it can't be undone.
      </p>
    </Modal>
  )
}
