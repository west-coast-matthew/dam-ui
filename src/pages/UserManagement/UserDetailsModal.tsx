import { Modal } from '../../components/Modal'
import { Button } from '../../components/FormControls'
import type { User } from '../../services/userService'
import { formatDate, fullName, initials, ROLE_DESCRIPTION, ROLE_LABEL } from './userFormat'

export interface UserDetailsModalProps {
  user: User | null
  onClose: () => void
  onEdit: (user: User) => void
}

/** Read-only view of a user. */
export function UserDetailsModal({ user, onClose, onEdit }: UserDetailsModalProps) {
  return (
    <Modal
      open={user !== null}
      title="User details"
      onClose={onClose}
      footer={
        user && (
          <>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={() => onEdit(user)}>Edit user</Button>
          </>
        )
      }
    >
      {user && (
        <>
          <div className="um-profile">
            <span className="um-avatar um-avatar--lg" aria-hidden="true">{initials(user)}</span>
            <div>
              <p className="um-profile__name">{fullName(user)}</p>
              <p className="um-profile__email">{user.email}</p>
            </div>
          </div>
          <dl className="um-details">
            <div><dt>User name</dt><dd>{user.username}</dd></div>
            <div><dt>Role</dt><dd>{ROLE_LABEL[user.role]}<span className="um-details__hint">{ROLE_DESCRIPTION[user.role]}</span></dd></div>
            <div>
              <dt>Status</dt>
              <dd><span className={`um-status um-status--${user.active ? 'active' : 'inactive'}`}>{user.active ? 'Active' : 'Inactive'}</span></dd>
            </div>
            <div><dt>Created</dt><dd>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </>
      )}
    </Modal>
  )
}
