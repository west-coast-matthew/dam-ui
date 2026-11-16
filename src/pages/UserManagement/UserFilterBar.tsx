import { Button, SegmentedControl } from '../../components/FormControls'
import type { UserSort, UserSortField } from '../../services/userService'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from './icons'

const FIELDS: { value: UserSortField; label: string }[] = [
  { value: 'lastName', label: 'Last name' },
  { value: 'createdAt', label: 'Date created' },
]

/** What the direction button says for each field and direction. */
const DIRECTION_LABEL: Record<UserSortField, Record<UserSort['direction'], string>> = {
  lastName: { asc: 'A–Z', desc: 'Z–A' },
  createdAt: { asc: 'Oldest first', desc: 'Newest first' },
}

export interface UserFilterBarProps {
  sort: UserSort
  onSortChange: (sort: UserSort) => void
  onAddUser: () => void
  /** Total users, once loaded. */
  count: number | null
  /** True while a new list is loading behind the current one. */
  updating: boolean
  disabled?: boolean
}

/** Sort controls and the Add user button above the user list. */
export function UserFilterBar({ sort, onSortChange, onAddUser, count, updating, disabled }: UserFilterBarProps) {
  const other = sort.direction === 'asc' ? 'desc' : 'asc'
  return (
    <div className="um-filters">
      <fieldset className="um-filters__sort" disabled={disabled}>
        <legend className="fc-visually-hidden">Sort users</legend>
        <span className="um-filters__label" aria-hidden="true">Sort by</span>
        <SegmentedControl
          legend="Sort by"
          hideLegend
          options={FIELDS}
          value={sort.field}
          // Each field starts in its natural direction: names A–Z, dates newest first.
          onChange={(field) => onSortChange({ field, direction: field === 'lastName' ? 'asc' : 'desc' })}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={sort.direction === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
          aria-label={`Sort order: ${DIRECTION_LABEL[sort.field][sort.direction]}. Switch to ${DIRECTION_LABEL[sort.field][other]}.`}
          onClick={() => onSortChange({ ...sort, direction: other })}
        >
          {DIRECTION_LABEL[sort.field][sort.direction]}
        </Button>
      </fieldset>
      <div className="um-filters__end">
        <span className="um-filters__count" aria-live="polite">
          {updating ? (
            <>
              <span className="fc-spinner" aria-hidden="true" /> Updating…
            </>
          ) : (
            count !== null && `${count} ${count === 1 ? 'user' : 'users'}`
          )}
        </span>
        <Button icon={<PlusIcon />} onClick={onAddUser}>Add user</Button>
      </div>
    </div>
  )
}
