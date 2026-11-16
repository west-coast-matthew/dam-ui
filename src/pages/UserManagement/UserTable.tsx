import type { User } from '../../services/userService'
import { ActivateIcon, DeactivateIcon, EditIcon } from './icons'
import { formatDate, fullName, initials, ROLE_LABEL } from './userFormat'

export interface UserTableProps {
  users: User[]
  /** Username of the signed-in user, who can't deactivate themselves. */
  currentUsername: string
  pendingIds: Set<string>
  /** Dims the list while a new sort loads. */
  stale: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onToggleActive: (user: User) => void
}

/** The user list. Clicking a row shows the user's details; the icons edit or (de)activate. */
export function UserTable({ users, currentUsername, pendingIds, stale, onView, onEdit, onToggleActive }: UserTableProps) {
  return (
    <table className={`um-table${stale ? ' um-table--stale' : ''}`} aria-busy={stale || undefined}>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col" className="um-col-role">Role</th>
          <th scope="col">Status</th>
          <th scope="col" className="um-col-created">Created</th>
          <th scope="col"><span className="fc-visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const name = fullName(user)
          const pending = pendingIds.has(user.id)
          const isSelf = user.username === currentUsername
          return (
            <tr key={user.id} className={user.active ? undefined : 'um-row--inactive'} onClick={() => onView(user)}>
              <td>
                <div className="um-user">
                  <span className="um-avatar" aria-hidden="true">{initials(user)}</span>
                  <span className="um-user__text">
                    {/* The name is the keyboard way to open the details; the whole row works for the mouse. */}
                    <button type="button" className="um-user__name" onClick={(e) => { e.stopPropagation(); onView(user) }}>
                      {name}
                    </button>
                    {isSelf && <span className="um-you">You</span>}
                    <span className="um-user__email">{user.email}</span>
                  </span>
                </div>
              </td>
              <td className="um-col-role">{ROLE_LABEL[user.role]}</td>
              <td>
                <span className={`um-status um-status--${user.active ? 'active' : 'inactive'}`}>
                  {pending && <span className="fc-spinner" aria-hidden="true" />}
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="um-col-created">{formatDate(user.createdAt)}</td>
              <td>
                <div className="um-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="um-icon-button"
                    aria-label={`Edit ${name}`}
                    title="Edit"
                    onClick={() => onEdit(user)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className={`um-icon-button${user.active ? ' um-icon-button--danger' : ' um-icon-button--positive'}`}
                    aria-label={`${user.active ? 'Deactivate' : 'Activate'} ${name}`}
                    title={isSelf ? "You can't deactivate your own account" : user.active ? 'Deactivate' : 'Activate'}
                    disabled={pending || (isSelf && user.active)}
                    onClick={() => onToggleActive(user)}
                  >
                    {user.active ? <DeactivateIcon /> : <ActivateIcon />}
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
