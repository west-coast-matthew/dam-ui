import { ActivityRow, type BadgeTone } from './ActivityRow'
import { formatBytes, plural } from './format'
import { AudioIcon, DocIcon, FileIcon, FolderIcon, ImageIcon, LightboxIcon, VideoIcon } from './icons'
import type { ActivityMediaType, RecentCategory, RecentLightbox, RecentUpload, UploadStatus } from './types'

const STATUS_BADGE: Record<UploadStatus, { label: string; tone: BadgeTone }> = {
  PENDING_PROCESSING: { label: 'Processing', tone: 'pending' },
  READY: { label: 'Ready', tone: 'positive' },
  FAILED: { label: 'Failed', tone: 'negative' },
}

const MEDIA_ICON: Record<ActivityMediaType, () => React.JSX.Element> = {
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  DOCUMENT: DocIcon,
  AUDIO: AudioIcon,
  OTHER: FileIcon,
}

interface ListProps<T> {
  items: T[]
  now: number
  onOpen?: (item: T) => void
}

export function UploadList({ items, now, onOpen }: ListProps<RecentUpload>) {
  return (
    <ul className="rap-list">
      {items.map((upload) => {
        const name = upload.title?.trim() || upload.originalFilename
        const Icon = MEDIA_ICON[upload.mediaType]
        const status = STATUS_BADGE[upload.status]
        return (
          <ActivityRow
            key={upload.id}
            leading={
              upload.thumbnailUrl ? (
                <img className="rap-thumb" src={upload.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                <span className="rap-icon"><Icon /></span>
              )
            }
            primary={name}
            secondary={
              <>
                {name !== upload.originalFilename && <>{upload.originalFilename} · </>}
                {formatBytes(upload.fileSize)} · {upload.catalogName}
              </>
            }
            badge={status}
            time={upload.uploadedAt}
            now={now}
            label={`${name}, ${status.label}, uploaded to ${upload.catalogName}`}
            onOpen={onOpen && (() => onOpen(upload))}
          />
        )
      })}
    </ul>
  )
}

export function CategoryList({ items, now, onOpen }: ListProps<RecentCategory>) {
  return (
    <ul className="rap-list">
      {items.map((category) => (
        <ActivityRow
          key={`${category.id}-${category.action}-${category.occurredAt}`}
          leading={<span className="rap-icon"><FolderIcon /></span>}
          primary={category.name}
          secondary={
            <>
              {category.parentName ? `In ${category.parentName}` : 'Top-level'} · {category.catalogName}
            </>
          }
          badge={category.action === 'created' ? { label: 'Created', tone: 'accent' } : { label: 'Updated', tone: 'neutral' }}
          time={category.occurredAt}
          now={now}
          label={`Category ${category.name}, ${category.action}, in ${category.catalogName}`}
          onOpen={onOpen && (() => onOpen(category))}
        />
      ))}
    </ul>
  )
}

export function LightboxList({ items, now, onOpen }: ListProps<RecentLightbox>) {
  return (
    <ul className="rap-list">
      {items.map((lightbox) => (
        <ActivityRow
          key={lightbox.id}
          leading={<span className="rap-icon"><LightboxIcon /></span>}
          primary={lightbox.title}
          secondary={
            <>
              {plural(lightbox.itemCount, 'item')} · {lightbox.catalogName}
              {lightbox.description && <> · {lightbox.description}</>}
            </>
          }
          badge={lightbox.shared ? { label: 'Shared', tone: 'accent' } : { label: 'Private', tone: 'neutral' }}
          time={lightbox.createdAt}
          now={now}
          label={`Lightbox ${lightbox.title}, ${plural(lightbox.itemCount, 'item')}, ${lightbox.shared ? 'shared' : 'private'}`}
          onOpen={onOpen && (() => onOpen(lightbox))}
        />
      ))}
    </ul>
  )
}
