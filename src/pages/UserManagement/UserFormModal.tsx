import { useState, type FormEvent } from 'react'
import { Button, Select, Switch, TextField } from '../../components/FormControls'
import { Modal } from '../../components/Modal'
import type { User, UserInput, UserRole } from '../../services/userService'
import { useSaveUser } from './useUsers'
import { errorMessage, fullName, ROLE_DESCRIPTION, ROLE_LABEL } from './userFormat'

export interface UserFormModalProps {
  /** 'new' opens an empty form; a user opens it for editing; null closes it. */
  target: User | 'new' | null
  /** Username of the signed-in user, who can't deactivate themselves. */
  currentUsername: string
  onClose: () => void
  onSaved: (user: User) => void
}

const ROLES: UserRole[] = ['admin', 'editor', 'viewer']
const EMPTY: UserInput = { firstName: '', lastName: '', email: '', role: 'viewer', active: true }

function validate(input: UserInput) {
  return {
    firstName: input.firstName.trim() ? undefined : 'Enter a first name.',
    lastName: input.lastName.trim() ? undefined : 'Enter a last name.',
    email: !input.email.trim()
      ? 'Enter an email address.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ? undefined : 'Enter a valid email address, like name@example.com.',
  }
}

/** Add and edit share this form; the parent remounts it (by key) for each user. */
function UserForm({ target, currentUsername, onClose, onSaved }: Omit<UserFormModalProps, 'target'> & { target: User | 'new' }) {
  const editing = target !== 'new'
  const [input, setInput] = useState<UserInput>(
    editing ? { firstName: target.firstName, lastName: target.lastName, email: target.email, role: target.role, active: target.active } : EMPTY,
  )
  const [attempted, setAttempted] = useState(false)
  const save = useSaveUser()
  const errors: Partial<ReturnType<typeof validate>> = attempted ? validate(input) : {}
  const isSelf = editing && target.username === currentUsername
  const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => setInput((i) => ({ ...i, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (Object.values(validate(input)).some(Boolean) || save.isPending) return
    save.mutate({ id: editing ? target.id : undefined, input }, { onSuccess: onSaved })
  }

  const formId = 'um-user-form'
  return (
    <Modal
      open
      title={editing ? `Edit ${fullName(target)}` : 'Add user'}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="submit" form={formId} loading={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add user'}
          </Button>
        </>
      }
    >
      <form id={formId} className="um-form" onSubmit={submit} noValidate>
        {save.isError && <p className="um-form__error" role="alert">{errorMessage(save.error)}</p>}
        <fieldset className="um-form__fields" disabled={save.isPending}>
          <legend className="fc-visually-hidden">User details</legend>
          <div className="um-form__row">
            <TextField label="First name" required autoFocus value={input.firstName} error={errors.firstName}
              autoComplete="off" maxLength={80} onChange={(e) => set('firstName', e.target.value)} />
            <TextField label="Last name" required value={input.lastName} error={errors.lastName}
              autoComplete="off" maxLength={80} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <TextField label="Email" type="email" required value={input.email} error={errors.email}
            autoComplete="off" maxLength={200} onChange={(e) => set('email', e.target.value)} />
          <Select label="Role" value={input.role} hint={ROLE_DESCRIPTION[input.role]}
            disabled={isSelf}
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            onChange={(e) => set('role', e.target.value as UserRole)} />
          <Switch label="Active" checked={input.active} disabled={isSelf}
            description={isSelf ? "You can't change your own role or deactivate your own account." : 'Inactive users can’t sign in.'}
            onChange={(e) => set('active', e.target.checked)} />
        </fieldset>
      </form>
    </Modal>
  )
}

export function UserFormModal(props: UserFormModalProps) {
  if (!props.target) return null
  const { target } = props
  return <UserForm key={target === 'new' ? 'new' : target.id} {...props} target={target} />
}
