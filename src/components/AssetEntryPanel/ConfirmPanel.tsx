import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { formatBytes } from '../AssetUploadPanel'
import { AwaitingResponse } from '../AwaitingResponse'
import { Button } from '../FormControls'
import type { UploadItem } from './useUploadRun'

/** A file as the review lists it. */
export interface ReviewFile {
  key: number
  file: File
  /** The title it will get; empty means the file name is used. */
  title: string
}

export interface ConfirmPanelProps {
  /** 'review' asks for confirmation; 'run' shows the upload in progress, then its outcome. */
  stage: 'review' | 'run'
  workspaceName: string
  catalogName: string
  /** e.g. "Marketing / Campaigns / 2026". */
  categoryPath: string
  files: ReviewFile[]
  description: string
  /** The run's files and their status (stage 'run'). */
  items: UploadItem[]
  running: boolean
  cancelling: boolean
  onBack: () => void
  onConfirm: () => void
  onCancelUpload: () => void
  onRetry: () => void
  onDone: () => void
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/**
 * The panel that swipes in over the entry form after Continue: a summary to check and confirm, then
 * the upload's progress (AwaitingResponse) and, once it finishes, what went in and what didn't.
 */
export function ConfirmPanel(props: ConfirmPanelProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const { stage, running } = props
  const finished = stage === 'run' && !running

  // Move focus to the heading whenever the panel's content changes, so keyboard and screen reader
  // users land on it.
  useEffect(() => {
    heading.current?.focus()
  }, [stage, finished])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && stage === 'review') {
      e.stopPropagation()
      props.onBack()
    }
  }

  return (
    <div className="aep-confirm" role="region" aria-labelledby="aep-confirm-title" onKeyDown={onKeyDown}>
      {stage === 'review' ? (
        <Review {...props} headingRef={heading} />
      ) : running ? (
        <Running {...props} headingRef={heading} />
      ) : (
        <Outcome {...props} headingRef={heading} />
      )}
    </div>
  )
}

type SectionProps = ConfirmPanelProps & { headingRef: RefObject<HTMLHeadingElement | null> }

function Review({ workspaceName, catalogName, categoryPath, files, description, onBack, onConfirm, headingRef }: SectionProps) {
  const total = files.reduce((sum, f) => sum + f.file.size, 0)
  const count = files.length
  return (
    <>
      <div className="aep-confirm__body">
        <h3 id="aep-confirm-title" ref={headingRef} tabIndex={-1} className="aep-confirm__title">
          Review and confirm
        </h3>
        <p className="aep-confirm__lead">
          {count === 1 ? 'This file becomes a new asset' : `Each of these ${count.toLocaleString()} files becomes its own asset`}. Check the details, then confirm.
        </p>

        <dl className="aep-summary">
          <div><dt>Workspace</dt><dd>{workspaceName}</dd></div>
          <div><dt>Catalog</dt><dd>{catalogName}</dd></div>
          <div><dt>Category</dt><dd>{categoryPath}</dd></div>
          <div><dt>Files</dt><dd>{plural(count, 'file', 'files')} · {formatBytes(total)}</dd></div>
          <div>
            <dt>Description</dt>
            <dd className={description.trim() ? undefined : 'aep-summary__none'}>{description.trim() || 'None'}</dd>
          </div>
        </dl>

        <ul className="aep-review-list" aria-label="Files">
          {files.map((f) => (
            <li key={f.key}>
              <span className="aep-review-list__title">{f.title.trim() || f.file.name}</span>
              {f.title.trim() && <span className="aep-review-list__file">{f.file.name}</span>}
              <span className="aep-review-list__size">{formatBytes(f.file.size)}</span>
            </li>
          ))}
        </ul>
      </div>
      <footer className="aep-confirm__footer">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button onClick={onConfirm}>{count === 1 ? 'Upload asset' : `Upload ${count.toLocaleString()} assets`}</Button>
      </footer>
    </>
  )
}

function Running({ items, cancelling, onCancelUpload, headingRef }: SectionProps) {
  const settled = items.filter((i) => i.status !== 'waiting' && i.status !== 'uploading').length
  const current = items.find((i) => i.status === 'uploading')
  const total = items.length
  return (
    <div className="aep-confirm__body aep-confirm__body--center">
      <h3 id="aep-confirm-title" ref={headingRef} tabIndex={-1} className="fc-visually-hidden">Uploading</h3>
      <AwaitingResponse
        title={total === 1 ? 'Uploading the asset…' : `Uploading ${total.toLocaleString()} assets…`}
        message={current ? <>Sending <strong>{current.title.trim() || current.file.name}</strong></> : undefined}
        progress={total > 1 ? { done: settled, total } : undefined}
        onCancel={onCancelUpload}
        cancelLabel={total > 1 ? 'Stop uploading' : 'Cancel upload'}
        cancelling={cancelling}
      />
    </div>
  )
}

function Outcome({ items, onRetry, onDone, headingRef }: SectionProps) {
  const done = items.filter((i) => i.status === 'done')
  const failed = items.filter((i) => i.status === 'failed')
  const cancelled = items.filter((i) => i.status === 'cancelled')
  const left = failed.length + cancelled.length

  let title: string
  if (left === 0) title = done.length === 1 ? 'The asset was uploaded' : `All ${done.length.toLocaleString()} assets were uploaded`
  else if (done.length === 0) title = cancelled.length === items.length ? 'The upload was cancelled' : 'Nothing was uploaded'
  else title = `${plural(done.length, 'asset was', 'assets were')} uploaded, ${left.toLocaleString()} not`

  return (
    <>
      <div className="aep-confirm__body">
        <h3 id="aep-confirm-title" ref={headingRef} tabIndex={-1} className={`aep-confirm__title aep-confirm__title--${left ? 'warning' : 'success'}`}>
          {title}
        </h3>
        {left > 0 && (
          <p className="aep-confirm__lead">
            The files that didn't go in are kept, so you can try them again or change them first.
          </p>
        )}
        <ul className="aep-review-list aep-review-list--outcome" aria-label="Results">
          {items.map((i) => (
            <li key={i.key} className={`aep-review-list--${i.status}`}>
              <span className="aep-review-list__title">{i.title.trim() || i.file.name}</span>
              <span className="aep-review-list__state">
                {i.status === 'done' ? 'Uploaded' : i.status === 'failed' ? (i.error ?? 'Failed') : 'Not sent'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <footer className="aep-confirm__footer">
        {left > 0 && <Button variant="secondary" onClick={onRetry}>Retry {plural(left, 'file', 'files')}</Button>}
        <Button onClick={onDone}>{left > 0 ? 'Back to files' : 'Add more assets'}</Button>
      </footer>
    </>
  )
}
