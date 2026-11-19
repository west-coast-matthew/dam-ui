import { useState } from 'react'
import { Checkbox } from '../../../components/FormControls'
import { ThemeSelect } from '../../../components/ThemeSelect'
import {
  appendTreeNode,
  moveTreeNode,
  removeTreeNode,
  TreeControl,
  typeNoun,
  type TreeMove,
  type TreeNode,
  type TreeNodeType,
} from '../../../components/TreeControl'
import { mockTree, renameNode } from './mockTree'
import './CustomComponents.css'

const MAX_LOG = 8

/** Mockup page for the app's custom components. The page owns all data; components only raise events. */
export function CustomComponents() {
  const [tree, setTree] = useState<TreeNode[]>(mockTree)
  const [selected, setSelected] = useState<TreeNode | null>(null)
  const [editable, setEditable] = useState(true)
  const [subtreeExpand, setSubtreeExpand] = useState(true)
  const [expandAll, setExpandAll] = useState(false)
  const [log, setLog] = useState<{ id: number; text: string }[]>([])

  const record = (entry: string) => {
    console.log('[CustomComponents]', entry)
    setLog((prev) => [{ id: (prev[0]?.id ?? 0) + 1, text: entry }, ...prev].slice(0, MAX_LOG))
  }

  const onSelect = (node: TreeNode) => {
    setSelected(node)
    record(`onSelect: ${node.label} (${node.id})`)
  }

  const onLabelEdit = (node: TreeNode, newLabel: string) => {
    setTree((prev) => renameNode(prev, node.id, newLabel))
    setSelected((s) => (s?.id === node.id ? { ...s, label: newLabel } : s))
    record(`onLabelEdit: "${node.label}" → "${newLabel}"`)
  }

  // The demo applies adds and deletes straight away; a real page would ask first (see the Categories page).
  const onAdd = (parent: TreeNode, type: TreeNodeType) => {
    const node: TreeNode = { id: crypto.randomUUID(), label: `New ${typeNoun(type)}`, type, ...(type === 'assetBucket' ? { count: 0 } : {}) }
    setTree((prev) => appendTreeNode(prev, parent.id, node))
    record(`onAdd: ${typeNoun(type)} in ${parent.label}`)
  }

  const onEdit = (node: TreeNode) => record(`onEdit: ${node.label} (a page would open a form here)`)

  const onDelete = (node: TreeNode) => {
    setTree((prev) => removeTreeNode(prev, node.id))
    setSelected((s) => (s?.id === node.id ? null : s))
    record(`onDelete: ${node.label}`)
  }

  const onMove = ({ node, target, position }: TreeMove) => {
    setTree((prev) => moveTreeNode(prev, node.id, target.id, position))
    record(`onMove: ${node.label} ${position} ${target.label}`)
  }

  const onExpandedChange = (node: TreeNode, expanded: boolean) =>
    record(`onExpandedChange: ${node.label} ${expanded ? 'expanded' : 'collapsed'}`)

  return (
    <div className="cc-page">
      <header className="cc-header">
        <div>
          <h1>Custom components</h1>
          <p className="cc-muted">Reusable components shown with sample data. Events are logged below and to the console.</p>
        </div>
        <ThemeSelect />
      </header>

      <section className="cc-section">
        <h2 className="cc-section-title">Tree control</h2>
        <p className="cc-muted cc-intro">
          Click a node to select it and the arrow to expand it. Hover for its description.
          {' Folders are categories; buckets are asset buckets, with their asset count.'}
          {editable && ' Double-click a label (or press F2) to rename it, drag items to move them, and right-click (or press Shift+F10) to add, edit or delete.'}
          {subtreeExpand && ' Right-click a category to expand or collapse everything below it.'}
        </p>

        <div className="cc-controls">
          <Checkbox label="Editable" checked={editable} onChange={(e) => setEditable(e.target.checked)} />
          <Checkbox label="Right-click subtree expand" checked={subtreeExpand}
            onChange={(e) => setSubtreeExpand(e.target.checked)} />
          <Checkbox label="Expand all" checked={expandAll} onChange={(e) => setExpandAll(e.target.checked)} />
        </div>

        <div className="cc-grid">
          <div>
            <h3 className="cc-caption">Interactive, scrolls at 360px</h3>
            <TreeControl
              label="Asset categories"
              nodes={tree}
              maxHeight={360}
              expandAll={expandAll}
              enableSubtreeExpand={subtreeExpand}
              onSelect={onSelect}
              editable={editable}
              onLabelEdit={onLabelEdit}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onExpandedChange={onExpandedChange}
            />
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <h3 className="cc-caption">Selected node</h3>
              {selected ? (
                <dl className="cc-details">
                  <dt>Label</dt>
                  <dd>{selected.label}</dd>
                  <dt>ID</dt>
                  <dd><code>{selected.id}</code></dd>
                  <dt>Description</dt>
                  <dd>{selected.description ?? <span className="cc-muted">None</span>}</dd>
                  <dt>Type</dt>
                  <dd>{typeNoun(selected.type)}</dd>
                  {selected.type === 'assetBucket' ? (
                    <>
                      <dt>Assets</dt>
                      <dd>{selected.count ?? 0}</dd>
                    </>
                  ) : (
                    <>
                      <dt>Children</dt>
                      <dd>{selected.children?.length ?? 0}</dd>
                    </>
                  )}
                </dl>
              ) : (
                <p className="cc-muted">Nothing selected yet.</p>
              )}
            </div>

            <div className="cc-card">
              <h3 className="cc-caption">Event log</h3>
              {log.length ? (
                <ol className="cc-log">
                  {log.map((entry) => <li key={entry.id}>{entry.text}</li>)}
                </ol>
              ) : (
                <p className="cc-muted">No events yet.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="cc-caption">Read-only, opens on Marketing › Campaigns</h3>
            <TreeControl
              label="Asset categories (read-only)"
              nodes={tree}
              maxHeight={240}
              defaultExpandedIds={['marketing', 'campaigns']}
            />
          </div>

          <div>
            <h3 className="cc-caption">Empty</h3>
            <TreeControl label="Empty tree" nodes={[]} emptyMessage="No categories have been created yet." />
          </div>
        </div>
      </section>
    </div>
  )
}
