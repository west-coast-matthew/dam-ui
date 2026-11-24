import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { uploadAsset } from '../../services/assetService'

export type UploadStatus = 'waiting' | 'uploading' | 'done' | 'failed' | 'cancelled'

/** One file in an upload run. `key` ties it back to the panel's file entry. */
export interface UploadItem {
  key: number
  file: File
  title: string
  description: string
  status: UploadStatus
  error?: string
}

export interface UploadTarget {
  catalogId: string
  categoryId: string
}

const message = (error: unknown) => (error instanceof Error ? error.message : 'The upload failed.')

/**
 * Uploads files one at a time (POST /assets each), tracking every file's status so the panel can show
 * progress and the outcome. cancel() stops the current upload and skips the rest.
 */
export function useUploadRun() {
  const client = useQueryClient()
  const [items, setItems] = useState<UploadItem[]>([])
  const [running, setRunning] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const controller = useRef<AbortController | null>(null)

  const start = useCallback(
    async (files: Omit<UploadItem, 'status' | 'error'>[], target: UploadTarget): Promise<UploadItem[]> => {
      const abort = new AbortController()
      controller.current = abort
      const set = (key: number, patch: Partial<UploadItem>) => {
        const i = results.findIndex((item) => item.key === key)
        results[i] = { ...results[i], ...patch }
        setItems([...results])
      }

      const results: UploadItem[] = files.map((f) => ({ ...f, status: 'waiting' }))
      setItems(results)
      setRunning(true)
      setCancelling(false)
      let uploaded = 0
      for (const f of files) {
        if (abort.signal.aborted) {
          set(f.key, { status: 'cancelled' })
          continue
        }
        set(f.key, { status: 'uploading' })
        try {
          await uploadAsset(
            { ...target, file: f.file, title: f.title, description: f.description, versioningEnabled: true },
            { signal: abort.signal },
          )
          uploaded++
          set(f.key, { status: 'done' })
        } catch (error) {
          if (abort.signal.aborted) set(f.key, { status: 'cancelled' })
          else set(f.key, { status: 'failed', error: message(error) })
        }
      }
      controller.current = null
      setRunning(false)
      setCancelling(false)
      // The category tree shows asset counts.
      if (uploaded > 0) void client.invalidateQueries({ queryKey: ['categories', target.catalogId] })
      return results
    },
    [client],
  )

  const cancel = useCallback(() => {
    if (!controller.current) return
    setCancelling(true)
    controller.current.abort()
  }, [])

  const reset = useCallback(() => setItems([]), [])

  return { items, running, cancelling, start, cancel, reset }
}
