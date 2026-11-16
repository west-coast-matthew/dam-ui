import { keepPreviousData, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  listUsers,
  setUserActive,
  updateUser,
  type User,
  type UserInput,
  type UserSort,
} from '../../services/userService'

const USERS = ['users'] as const
const TOGGLE_KEY = ['users', 'toggle-active'] as const

/** The user list, sorted by the service. Keeps showing the previous list while a new sort loads. */
export function useUsers(sort: UserSort) {
  return useQuery({
    queryKey: [...USERS, 'list', sort.field, sort.direction],
    queryFn: () => listUsers(sort),
    placeholderData: keepPreviousData,
  })
}

/** Creates a user (no id) or updates one, then refreshes every list. */
export function useSaveUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: UserInput }) => (id ? updateUser(id, input) : createUser(input)),
    onSuccess: () => client.invalidateQueries({ queryKey: USERS }),
  })
}

/**
 * Activates or deactivates a user. The change shows straight away (the call takes seconds)
 * and is rolled back if the service refuses it.
 */
export function useToggleActive() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: ({ user, active }: { user: User; active: boolean }) => setUserActive(user.id, active),
    onMutate: async ({ user, active }) => {
      await client.cancelQueries({ queryKey: USERS })
      const snapshot = client.getQueriesData<User[]>({ queryKey: [...USERS, 'list'] })
      client.setQueriesData<User[]>({ queryKey: [...USERS, 'list'] }, (list) =>
        list?.map((u) => (u.id === user.id ? { ...u, active } : u)),
      )
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => client.setQueryData(key, data))
    },
    onSettled: () => client.invalidateQueries({ queryKey: USERS }),
  })
}

/** Ids of users whose active status is being changed right now. */
export function usePendingToggles(): Set<string> {
  const ids = useMutationState({
    filters: { mutationKey: TOGGLE_KEY, status: 'pending' },
    select: (m) => (m.state.variables as { user: User } | undefined)?.user.id,
  })
  return new Set(ids.filter((id): id is string => Boolean(id)))
}
