export function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
