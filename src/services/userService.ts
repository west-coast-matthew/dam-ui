import { seedUsers } from './mockUsers'

// User service. For now it emulates the API: data lives in memory (reset on reload) and every
// call waits a random 2-8 seconds to mimic network latency. Replace the bodies with real requests
// once the API has user endpoints; callers only depend on these signatures.

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  active: boolean
  /** ISO date-time. */
  createdAt: string
}

/** Fields a create or update sends. */
export type UserInput = Pick<User, 'firstName' | 'lastName' | 'email' | 'role' | 'active'>

export type UserSortField = 'lastName' | 'createdAt'
export type SortDirection = 'asc' | 'desc'

export interface UserSort {
  field: UserSortField
  direction: SortDirection
}

/** Thrown when an operation is refused, e.g. a duplicate email. Its message is safe to show. */
export class UserServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserServiceError'
  }
}

const MIN_DELAY_MS = 2000
const MAX_DELAY_MS = 8000

/**
 * For testing the error states: set localStorage['dam-ui.mock-user-failure-rate'] to a number
 * between 0 and 1 and that share of calls fails. Defaults to 0.
 */
const FAILURE_RATE_KEY = 'dam-ui.mock-user-failure-rate'

let users: User[] = seedUsers(Date.now())

function failureRate(): number {
  try {
    const rate = Number(localStorage.getItem(FAILURE_RATE_KEY))
    return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0
  } catch {
    return 0
  }
}

/** Waits 2-8 seconds, then sometimes fails if a failure rate is set. */
async function network(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  await new Promise((resolve) => setTimeout(resolve, ms))
  if (Math.random() < failureRate()) throw new Error("The user service didn't respond. Please try again.")
}

const copy = (u: User): User => ({ ...u })

function compare(sort: UserSort) {
  const dir = sort.direction === 'asc' ? 1 : -1
  return (a: User, b: User) => {
    const primary =
      sort.field === 'lastName'
        ? a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' }) ||
          a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' })
        : a.createdAt.localeCompare(b.createdAt)
    return primary * dir
  }
}

function clean(input: UserInput): UserInput {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()
  if (!firstName || !lastName) throw new UserServiceError('First and last name are required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserServiceError('Enter a valid email address.')
  return { ...input, firstName, lastName, email }
}

function assertUniqueEmail(email: string, exceptId?: string) {
  if (users.some((u) => u.email === email && u.id !== exceptId)) {
    throw new UserServiceError(`A user with the email ${email} already exists.`)
  }
}

function find(id: string): User {
  const user = users.find((u) => u.id === id)
  if (!user) throw new UserServiceError('That user no longer exists.')
  return user
}

/** GET /users?sort=lastName,asc */
export async function listUsers(sort: UserSort): Promise<User[]> {
  await network()
  return [...users].sort(compare(sort)).map(copy)
}

/** GET /users/{id} */
export async function getUser(id: string): Promise<User> {
  await network()
  return copy(find(id))
}

/** POST /users */
export async function createUser(input: UserInput): Promise<User> {
  await network()
  const data = clean(input)
  assertUniqueEmail(data.email)
  const user: User = {
    ...data,
    id: `user-${crypto.randomUUID()}`,
    username: data.email.split('@')[0],
    createdAt: new Date().toISOString(),
  }
  users = [...users, user]
  return copy(user)
}

/** PUT /users/{id} */
export async function updateUser(id: string, input: UserInput): Promise<User> {
  await network()
  const data = clean(input)
  find(id)
  assertUniqueEmail(data.email, id)
  users = users.map((u) => (u.id === id ? { ...u, ...data } : u))
  return copy(find(id))
}

/** PATCH /users/{id} { active } */
export async function setUserActive(id: string, active: boolean): Promise<User> {
  await network()
  find(id)
  users = users.map((u) => (u.id === id ? { ...u, active } : u))
  return copy(find(id))
}
