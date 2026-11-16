import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../layout/PageHeader'
import type { User, UserSort } from '../../services/userService'
import { UserDetailsModal } from './UserDetailsModal'
import { UserFilterBar } from './UserFilterBar'
import { UserFormModal } from './UserFormModal'
import { UserTable } from './UserTable'
import { usePendingToggles, useToggleActive, useUsers } from './useUsers'
import { errorMessage, fullName } from './userFormat'
import './UserManagement.css'

interface Notice {
  tone: 'success' | 'error'
  text: string
}

/** Lets admins list, add, edit, activate and deactivate users. Data comes from the (mock) user service. */
export function UserManagement() {
  const { user: me } = useAuth()
  const [sort, setSort] = useState<UserSort>({ field: 'lastName', direction: 'asc' })
  const [viewing, setViewing] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const users = useUsers(sort)
  const toggle = useToggleActive()
  const pendingIds = usePendingToggles()

  if (me?.role !== 'admin') {
    return (
      <>
        <PageHeader title="User management" />
        <div className="um-card">
          <ErrorState title="Admins only" message="Ask an administrator if you need to manage users." />
        </div>
      </>
    )
  }

  const onToggleActive = (user: User) => {
    const active = !user.active
    setNotice(null)
    toggle.mutate(
      { user, active },
      {
        onSuccess: () => setNotice({ tone: 'success', text: `${fullName(user)} is now ${active ? 'active' : 'inactive'}.` }),
        onError: (error) =>
          setNotice({ tone: 'error', text: `Couldn't ${active ? 'activate' : 'deactivate'} ${fullName(user)}: ${errorMessage(error)}` }),
      },
    )
  }

  let body
  if (users.isPending) {
    body = <LoadingState label="Loading users…" />
  } else if (users.isError && !users.data) {
    body = <ErrorState title="Couldn't load users" message={errorMessage(users.error)} onRetry={() => void users.refetch()} />
  } else if (users.data.length === 0) {
    body = <p className="um-empty">No users yet. Add the first one.</p>
  } else {
    body = (
      <UserTable
        users={users.data}
        currentUsername={me.username}
        pendingIds={pendingIds}
        stale={users.isPlaceholderData}
        onView={setViewing}
        onEdit={setEditing}
        onToggleActive={onToggleActive}
      />
    )
  }

  return (
    <>
      <PageHeader title="User management" description="Add people, change their role and control who can sign in." />

      {notice && (
        <div className={`um-notice um-notice--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
          <span>{notice.text}</span>
          <button type="button" className="um-notice__dismiss" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="um-card" aria-label="Users">
        <UserFilterBar
          sort={sort}
          onSortChange={setSort}
          onAddUser={() => setEditing('new')}
          count={users.data ? users.data.length : null}
          updating={users.isFetching && !users.isPending}
          disabled={users.isPending}
        />
        {/* A failed refresh keeps the last list on screen and says so here. */}
        {users.isError && users.data && (
          <p className="um-refresh-error" role="alert">
            Couldn't refresh the list: {errorMessage(users.error)}{' '}
            <button type="button" className="um-link" onClick={() => void users.refetch()}>Try again</button>
          </p>
        )}
        <div className="um-body">{body}</div>
      </section>

      <UserDetailsModal
        user={viewing}
        onClose={() => setViewing(null)}
        onEdit={(user) => {
          setViewing(null)
          setEditing(user)
        }}
      />
      <UserFormModal
        target={editing}
        currentUsername={me.username}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          setNotice({ tone: 'success', text: editing === 'new' ? `${fullName(saved)} was added.` : `Changes to ${fullName(saved)} were saved.` })
          setEditing(null)
        }}
      />
    </>
  )
}
