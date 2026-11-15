/** Returns a copy of `order` with the two ids swapped. Unknown ids leave it unchanged. */
export function swapIds(order: readonly string[], a: string, b: string): string[] {
  const i = order.indexOf(a)
  const j = order.indexOf(b)
  if (i === -1 || j === -1 || i === j) return [...order]
  const next = [...order]
  next[i] = b
  next[j] = a
  return next
}
