/** Position of `value` between `min` and `max`, as a 0–100 percentage. */
export function percentOf(value: number, min: number, max: number) {
  return max === min ? 0 : ((value - min) / (max - min)) * 100
}

/** Id of the message element under a field, used for aria-describedby. */
export function messageId(id: string) {
  return `${id}-message`
}
