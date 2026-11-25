import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Field, type FieldMessageProps } from './Field'
import { messageId } from './utils'

/** An existing tag offered while typing. */
export interface TagSuggestion {
  name: string
  /** Shown next to the name, e.g. how many assets carry the tag. */
  count?: number
}

export interface TagInputProps extends FieldMessageProps {
  label?: ReactNode
  /** The chosen tags, in order. */
  value: string[]
  onChange: (tags: string[]) => void
  /** Existing tags to offer; filtered by the typed text and the chosen tags. */
  suggestions?: TagSuggestion[]
  /** Called with the typed text, e.g. to fetch matching suggestions. */
  onInputChange?: (text: string) => void
  /** Shown in the suggestion list while suggestions are loading. */
  loading?: boolean
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  /** Longest tag name; longer input is cut. Defaults to 255, the API's limit. */
  maxTagLength?: number
  /** Most suggestions shown at once. */
  maxSuggestions?: number
  id?: string
  className?: string
}

const sameTag = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0

/**
 * Picks tags as removable chips. Typing filters the existing tags; Enter or a comma adds the typed
 * text (or the highlighted suggestion), Backspace in the empty input removes the last tag. Arrow
 * keys move through the suggestions and Escape closes them. Matching ignores case, so a tag can only
 * be chosen once, and an existing tag's spelling wins over the typed one.
 */
export function TagInput({
  label,
  hint,
  error,
  success,
  value,
  onChange,
  suggestions = [],
  onInputChange,
  loading = false,
  placeholder = 'Add a tag…',
  disabled = false,
  required,
  autoFocus,
  maxTagLength = 255,
  maxSuggestions = 8,
  id,
  className,
}: TagInputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const listId = `${fieldId}-suggestions`
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [listStyle, setListStyle] = useState<CSSProperties>()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [announcement, setAnnouncement] = useState('')

  const matches = useMemo(() => {
    const needle = text.trim().toLowerCase()
    return suggestions
      .filter((s) => !value.some((v) => sameTag(v, s.name)))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle))
      .slice(0, maxSuggestions)
  }, [suggestions, value, text, maxSuggestions])

  const showList = open && !disabled && (matches.length > 0 || (loading && text.trim() !== ''))
  const activeMatch = showList && active >= 0 ? matches[active] : undefined

  // The list is fixed to the viewport so panels with overflow: hidden don't clip it. It opens below
  // the field, or above it when there's more room there.
  useLayoutEffect(() => {
    if (!showList) return
    const place = () => {
      const box = anchorRef.current?.getBoundingClientRect()
      if (!box) return
      const below = window.innerHeight - box.bottom - 8
      const above = box.top - 8
      const up = below < 160 && above > below
      setListStyle({
        position: 'fixed',
        left: box.left,
        width: box.width,
        ...(up ? { bottom: window.innerHeight - box.top + 4, top: 'auto' } : { top: box.bottom + 4 }),
        maxHeight: Math.max(120, Math.min(240, up ? above : below)),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [showList, value.length])

  const setInput = (next: string) => {
    setText(next)
    setActive(-1)
    onInputChange?.(next)
  }

  /** Adds tags (skipping blanks and ones already chosen), using an existing tag's spelling. */
  const add = (names: string[]) => {
    const next = [...value]
    const added: string[] = []
    for (const raw of names) {
      const typed = raw.trim().slice(0, maxTagLength)
      if (!typed || next.some((v) => sameTag(v, typed))) continue
      const name = suggestions.find((s) => sameTag(s.name, typed))?.name ?? typed
      next.push(name)
      added.push(name)
    }
    if (added.length) {
      onChange(next)
      setAnnouncement(`Added ${added.join(', ')}.`)
    }
  }

  const remove = (tag: string) => {
    onChange(value.filter((v) => v !== tag))
    setAnnouncement(`Removed ${tag}.`)
  }

  const commitText = () => {
    if (text.trim()) add([text])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setOpen(true)
        if (matches.length) setActive((i) => (i + 1) % matches.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setOpen(true)
        if (matches.length) setActive((i) => (i <= 0 ? matches.length - 1 : i - 1))
        break
      case 'Enter':
        if (activeMatch) {
          e.preventDefault()
          add([activeMatch.name])
          setInput('')
        } else if (text.trim()) {
          e.preventDefault()
          commitText()
        }
        break
      case ',':
        e.preventDefault()
        commitText()
        break
      case 'Escape':
        // Close the list first; only a second Escape reaches an enclosing dialog.
        if (showList) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
          setActive(-1)
        }
        break
      case 'Backspace':
        if (!text && value.length) {
          e.preventDefault()
          remove(value[value.length - 1])
        }
        break
    }
  }

  const hasMessage = Boolean(error ?? success ?? hint)
  const describedBy = [hasMessage && messageId(fieldId), `${fieldId}-help`].filter(Boolean).join(' ')

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} success={success}
      required={required} disabled={disabled} className={['fc-tags', className].filter(Boolean).join(' ')}>
      <div className="fc-tags__anchor" ref={anchorRef}>
      <div className="fc-input fc-tags__box" onClick={() => inputRef.current?.focus()}>
        {value.length > 0 && (
          <ul className="fc-tags__chips" aria-label="Chosen tags">
            {value.map((tag) => (
              <li key={tag} className="fc-tags__chip">
                <span className="fc-tags__chip-name">{tag}</span>
                <button
                  type="button"
                  className="fc-tags__chip-remove"
                  aria-label={`Remove tag ${tag}`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(tag)
                    inputRef.current?.focus()
                  }}
                >
                  <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeMatch ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder={value.length ? '' : placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          value={text}
          maxLength={maxTagLength}
          onChange={(e) => {
            const raw = e.target.value
            // Pasted "a, b, c": every complete part becomes a tag.
            if (raw.includes(',')) {
              const parts = raw.split(',')
              add(parts.slice(0, -1))
              setInput(parts[parts.length - 1].trimStart())
            } else {
              setInput(raw)
            }
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Keep what was typed rather than losing it.
            commitText()
            setOpen(false)
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <span id={`${fieldId}-help`} className="fc-visually-hidden">
        Press Enter or comma to add a tag. Use the arrow keys to pick an existing tag.
      </span>
      <ul id={listId} role="listbox" aria-label="Existing tags" className="fc-tags__list" hidden={!showList} style={listStyle}>
        {matches.map((s, i) => (
          <li
            key={s.name}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={`fc-tags__option${i === active ? ' fc-tags__option--active' : ''}`}
            // mousedown would blur the input first and add the typed text instead.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              add([s.name])
              setInput('')
              inputRef.current?.focus()
            }}
            onMouseEnter={() => setActive(i)}
          >
            <span>{s.name}</span>
            {s.count !== undefined && <span className="fc-tags__count">{s.count}</span>}
          </li>
        ))}
        {matches.length === 0 && loading && <li className="fc-tags__option fc-tags__option--status" aria-disabled="true">Looking for tags…</li>}
      </ul>
      </div>
      <span className="fc-visually-hidden" aria-live="polite">{announcement}</span>
    </Field>
  )
}
