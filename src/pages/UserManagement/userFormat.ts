import type { User, UserRole } from '../../services/userService'

export const fullName = (u: Pick<User, 'firstName' | 'lastName'>) => `${u.firstName} ${u.lastName}`

export const initials = (u: Pick<User, 'firstName' | 'lastName'>) =>
  `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  admin: 'Manages users and every workspace setting.',
  editor: 'Uploads, edits and organises assets.',
  viewer: 'Browses and downloads assets.',
}

export function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
