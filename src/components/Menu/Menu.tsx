import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MenuContext, useMenu } from './MenuContext'
import './Menu.css'

const ITEM_SELECTOR = '[role^="menuitem"]:not([aria-disabled="true"])'

interface MenuProps {
  /** Content of the trigger button. */
  trigger: ReactNode
  /** Accessible name for the trigger when its content isn't text (e.g. an icon). */
  label?: string
  triggerClassName?: string
  /** Which edge of the trigger the menu lines up with. */
  align?: 'start' | 'end'
  children: ReactNode
}

/**
 * Button that opens a dropdown menu. Supports arrow keys, Home/End, Escape and
 * Tab, and closes on outside click. Focus returns to the button on close.
 */
export function Menu({ trigger, label, triggerClassName, align = 'start', children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const focusOnOpen = useRef<'first' | 'last'>('first')
  const menuId = useId()

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  // Focus the checked item, or the first/last item, when the menu opens.
  useEffect(() => {
    if (!open) return
    const all = items()
    const checked = all.find((el) => el.getAttribute('aria-checked') === 'true')
    const target = focusOnOpen.current === 'last' ? all.at(-1) : (checked ?? all[0])
    target?.focus()
  }, [open])

  // Close on a click outside.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close])

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusOnOpen.current = e.key === 'ArrowUp' ? 'last' : 'first'
      setOpen(true)
    }
  }

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const all = items()
    const index = all.indexOf(document.activeElement as HTMLElement)
    const focusAt = (i: number) => all[(i + all.length) % all.length]?.focus()
    switch (e.key) {
      case 'ArrowDown': focusAt(index + 1); break
      case 'ArrowUp': focusAt(index - 1); break
      case 'Home': focusAt(0); break
      case 'End': focusAt(all.length - 1); break
      case 'Escape': close(); break
      case 'Tab': close(false); return
      default: return
    }
    e.preventDefault()
  }

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        title={label}
        onClick={() => {
          focusOnOpen.current = 'first'
          setOpen((o) => !o)
        }}
        onKeyDown={onButtonKeyDown}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            className={`menu__popup menu__popup--${align}`}
            onKeyDown={onMenuKeyDown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MenuItemProps {
  onSelect?: () => void
  icon?: ReactNode
  /** Secondary text on the right, e.g. a shortcut or count. */
  detail?: ReactNode
  disabled?: boolean
  children: ReactNode
}

export function MenuItem({ onSelect, icon, detail, disabled, children }: MenuItemProps) {
  const menu = useMenu()
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className="menu__item"
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return
        menu?.close()
        onSelect?.()
      }}
    >
      <span className="menu__icon" aria-hidden="true">{icon}</span>
      <span className="menu__text">{children}</span>
      {detail && <span className="menu__detail">{detail}</span>}
    </button>
  )
}

interface MenuItemRadioProps extends Omit<MenuItemProps, 'icon'> {
  checked: boolean
}

/** One choice in a set where only one can be selected (e.g. theme, workspace). */
export function MenuItemRadio({ checked, onSelect, detail, disabled, children }: MenuItemRadioProps) {
  const menu = useMenu()
  return (
    <button
      type="button"
      role="menuitemradio"
      tabIndex={-1}
      aria-checked={checked}
      className="menu__item"
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return
        menu?.close()
        onSelect?.()
      }}
    >
      <span className="menu__icon" aria-hidden="true">
        {checked && (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
      </span>
      <span className="menu__text">{children}</span>
      {detail && <span className="menu__detail">{detail}</span>}
    </button>
  )
}

export function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="menu__group">
      <div id={id} className="menu__group-label">{label}</div>
      {children}
    </div>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="menu__separator" />
}

/** Non-interactive header text at the top of a menu, e.g. who is signed in. */
export function MenuHeader({ children }: { children: ReactNode }) {
  return <div className="menu__header">{children}</div>
}
