import { useState } from 'react'
import { ErrorState } from '../ErrorState'
import { Button } from '../FormControls'
import { LoadingState } from '../LoadingState'
import type { WorkspaceRecord } from '../../services/workspaceService'
import { useWorkspace } from '../../workspace/useWorkspace'
import { errorMessage, formatDate } from './format'
import { EditIcon, PlusIcon } from './icons'
import { useWorkspaceList } from './useWorkspaces'
import { WorkspaceFormModal } from './WorkspaceFormModal'
import './WorkspaceManagementPanel.css'

export interface WorkspaceManagementPanelProps {
  className?: string
}

/**
 * Lists workspaces and creates or edits their name and description, both in a modal.
 * Data comes from the (mock) workspace service.
 */
export function WorkspaceManagementPanel({ className }: WorkspaceManagementPanelProps) {
  const { current } = useWorkspace()
  const workspaces = useWorkspaceList()
  const [editing, setEditing] = useState<WorkspaceRecord | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  let body
  if (workspaces.isPending) {
    body = <LoadingState label="Loading workspaces…" />
  } else if (workspaces.isError && !workspaces.data) {
    body = (
      <ErrorState title="Couldn't load workspaces" message={errorMessage(workspaces.error)}
        onRetry={() => void workspaces.refetch()} />
    )
  } else if (workspaces.data.length === 0) {
    body = <p className="wm-empty">No workspaces yet. Create the first one.</p>
  } else {
    body = (
      <table className="wm-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col" className="wm-col-created">Created</th>
            <th scope="col"><span className="fc-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {workspaces.data.map((w) => (
            <tr key={w.id}>
              <td>
                <div className="wm-name">
                  <span className="wm-name__title">{w.name}</span>
                  {w.id === current.id && <span className="wm-current">Current</span>}
                </div>
                <p className={`wm-description${w.description ? '' : ' wm-description--none'}`}>
                  {w.description || 'No description'}
                </p>
              </td>
              <td className="wm-col-created">{formatDate(w.createdAt)}</td>
              <td className="wm-col-actions">
                <button type="button" className="wm-icon-button" aria-label={`Edit ${w.name}`} title="Edit"
                  onClick={() => setEditing(w)}>
                  <EditIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const count = workspaces.data?.length
  return (
    <section className={`wm-card${className ? ` ${className}` : ''}`} aria-labelledby="wm-title">
      <header className="wm-header">
        <div>
          <h2 id="wm-title" className="wm-header__title">Workspaces</h2>
          <p className="wm-header__count" aria-live="polite">
            {workspaces.isFetching && !workspaces.isPending ? (
              <><span className="fc-spinner" aria-hidden="true" /> Updating…</>
            ) : (
              count !== undefined && `${count} ${count === 1 ? 'workspace' : 'workspaces'}`
            )}
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={() => setEditing('new')} disabled={workspaces.isPending}>
          New workspace
        </Button>
      </header>

      {notice && (
        <div className="wm-notice" role="status">
          <span>{notice}</span>
          <button type="button" className="wm-notice__dismiss" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
        </div>
      )}
      {/* A failed refresh keeps the last list on screen and says so here. */}
      {workspaces.isError && workspaces.data && (
        <p className="wm-refresh-error" role="alert">
          Couldn't refresh the list: {errorMessage(workspaces.error)}{' '}
          <button type="button" className="wm-link" onClick={() => void workspaces.refetch()}>Try again</button>
        </p>
      )}

      <div className="wm-body">{body}</div>

      <WorkspaceFormModal
        target={editing}
        existing={workspaces.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          setNotice(editing === 'new' ? `${saved.name} was created.` : `Changes to ${saved.name} were saved.`)
          setEditing(null)
        }}
      />
    </section>
  )
}
