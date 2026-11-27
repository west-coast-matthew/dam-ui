import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { useAllLightboxItems } from '../../services/useLightboxes'
import { AssetThumb } from '../AssetExplorerPanel/AssetThumb'
import { SLIDE_INTERVALS, useBrowseStore, type SlideInterval } from '../AssetExplorerPanel/browseStore'
import { ErrorState } from '../ErrorState'
import { LoadingState } from '../LoadingState'
import { CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from './icons'

export interface SlideshowProps {
  /** Shown in the overlay's header, e.g. the lightbox title. */
  title: string
  /** The assets to show (the selection). */
  items?: BrowsedAsset[]
  /** Or a lightbox, whose items are loaded first. */
  lightboxId?: string
  onClose: () => void
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

/**
 * Browse mode: a full-screen overlay (native <dialog>, so focus stays inside and Escape closes it)
 * that shows each item large for the chosen interval, then moves on, looping after the last.
 * Render it only while it's open.
 */
export function Slideshow({ title, items, lightboxId, onClose }: SlideshowProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className="lbx-show"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {lightboxId ? (
        <LightboxSlides lightboxId={lightboxId} title={title} titleId={titleId} onClose={onClose} />
      ) : (
        <Player items={items ?? []} title={title} titleId={titleId} onClose={onClose} />
      )}
    </dialog>
  )
}

interface InnerProps {
  title: string
  titleId: string
  onClose: () => void
}

function LightboxSlides({ lightboxId, ...props }: InnerProps & { lightboxId: string }) {
  const items = useAllLightboxItems(lightboxId)
  if (items.data) return <Player items={items.data} {...props} />
  return (
    <div className="lbx-show__frame">
      <ShowHeader {...props} />
      <div className="lbx-show__stage lbx-show__stage--status">
        {items.isError ? (
          <ErrorState title="Couldn't load the lightbox's items" message={errorMessage(items.error)} onRetry={() => void items.refetch()} />
        ) : (
          <LoadingState label="Loading items…" />
        )}
      </div>
    </div>
  )
}

function ShowHeader({ title, titleId, onClose, position }: InnerProps & { position?: string }) {
  return (
    <header className="lbx-show__header">
      <h2 id={titleId} className="lbx-show__title">{title}</h2>
      {position && <span className="lbx-show__position" aria-live="polite">{position}</span>}
      <button type="button" className="lbx-show__icon" aria-label="Close browse mode" title="Close (Esc)" onClick={onClose}>
        <CloseIcon />
      </button>
    </header>
  )
}

/** The item large: an image's original, otherwise its thumbnail or type icon. */
function SlideMedia({ asset }: { asset: BrowsedAsset }) {
  const [failed, setFailed] = useState(false)
  if (asset.mediaType === 'IMAGE' && asset.fileUrl && !failed) {
    return <img src={asset.fileUrl} alt={displayTitle(asset)} onError={() => setFailed(true)} />
  }
  return <AssetThumb asset={asset} shape="natural" />
}

function Player({ items, title, titleId, onClose }: InnerProps & { items: BrowsedAsset[] }) {
  const interval = useBrowseStore((s) => s.slideInterval)
  const setInterval = useBrowseStore((s) => s.setSlideInterval)
  // `seq` changes on every move, so the timer restarts even when a one-item show "moves" to itself.
  const [slide, setSlide] = useState({ index: 0, seq: 0 })
  const [playing, setPlaying] = useState(true)
  const [hidden, setHidden] = useState(() => document.hidden)
  const remaining = useRef(interval * 1000)
  const startedAt = useRef(0)
  const count = items.length
  const index = Math.min(slide.index, Math.max(0, count - 1))
  const asset = items[index]
  const running = playing && !hidden && count > 0

  const go = useCallback((step: number) => {
    if (count === 0) return
    setSlide((s) => ({ index: (((s.index + step) % count) + count) % count, seq: s.seq + 1 }))
  }, [count])

  // Playback pauses while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // A new item (or interval) gets the full time. Runs after the timer's cleanup below.
  useEffect(() => {
    remaining.current = interval * 1000
  }, [slide.seq, interval])

  // Waits out the item's remaining time; pausing keeps what's left.
  useEffect(() => {
    if (!running) return
    startedAt.current = performance.now()
    const timer = setTimeout(() => go(1), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current))
    }
  }, [running, slide.seq, interval, go])

  // Preload the next image so it appears at once.
  useEffect(() => {
    const next = count > 1 ? items[(index + 1) % count] : null
    if (next?.mediaType === 'IMAGE' && next.fileUrl) new Image().src = next.fileUrl
  }, [items, index, count])

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('select')) return
    if (e.key === ' ') {
      e.preventDefault()
      setPlaying((p) => !p)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    }
  }

  if (!asset) {
    return (
      <div className="lbx-show__frame">
        <ShowHeader title={title} titleId={titleId} onClose={onClose} />
        <div className="lbx-show__stage lbx-show__stage--status">
          <p className="lbx-show__empty">There's nothing to browse yet.</p>
        </div>
      </div>
    )
  }

  const state = hidden && playing ? 'Paused while the tab is hidden' : playing ? 'Playing' : 'Paused'
  return (
    <div className="lbx-show__frame" onKeyDown={onKeyDown}>
      <ShowHeader title={title} titleId={titleId} onClose={onClose} position={`${index + 1} of ${count}`} />

      <div className="lbx-show__stage">
        <figure key={slide.seq} className={`lbx-show__slide lbx-show__slide--${asset.mediaType.toLowerCase()}`}>
          <SlideMedia asset={asset} />
          <figcaption className="lbx-show__caption">{displayTitle(asset)}</figcaption>
        </figure>
      </div>

      <div className="lbx-show__progress" aria-hidden="true">
        <span
          key={`${slide.seq}:${interval}`}
          className="lbx-show__progress-bar"
          style={{ animationDuration: `${interval}s`, animationPlayState: running ? 'running' : 'paused' }}
        />
      </div>

      <div className="lbx-show__controls" role="toolbar" aria-label="Browse mode controls">
        <button type="button" className="lbx-show__icon" aria-label="Previous item" title="Previous (←)" onClick={() => go(-1)}>
          <PrevIcon />
        </button>
        <button
          type="button"
          className="lbx-show__play"
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          onClick={() => setPlaying((p) => !p)}
          autoFocus
        >
          {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        </button>
        <button type="button" className="lbx-show__icon" aria-label="Next item" title="Next (→)" onClick={() => go(1)}>
          <NextIcon />
        </button>
        <label className="lbx-show__interval">
          <span>Show each for</span>
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value) as SlideInterval)}>
            {SLIDE_INTERVALS.map((s) => <option key={s} value={s}>{s} seconds</option>)}
          </select>
        </label>
        <span className="lbx-show__state" aria-live="polite">{state}</span>
      </div>
    </div>
  )
}
