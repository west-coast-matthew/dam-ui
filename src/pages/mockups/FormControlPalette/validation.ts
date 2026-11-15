export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  if (!value) return 'Email is required.'
  if (!EMAIL_PATTERN.test(value)) return 'Enter an email address like name@example.com.'
  return undefined
}

export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
  { label: 'Contains an upper-case letter', test: (v: string) => /[A-Z]/.test(v) },
]

const TAKEN_USERNAMES = ['admin', 'root', 'system']

export function validateUsername(value: string): string | undefined {
  if (!value) return undefined
  if (!/^[a-z0-9_-]{3,}$/i.test(value)) return 'Use at least 3 letters, numbers, - or _.'
  if (TAKEN_USERNAMES.includes(value.toLowerCase())) return `“${value}” is already taken.`
  return undefined
}
