'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { clsx } from 'clsx'

interface FileUploadProps {
  upload_url?: string
  accept?: string
  max_size?: number
  onUploadComplete?: (data: { url: string; name: string }) => void
  onUploadError?: (error: string) => void
  show_preview?: boolean
  className?: string
  placeholder?: string
}

type UploadStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export function FileUpload({
  upload_url = '/api/upload',
  accept = 'image/*',
  max_size = 5 * 1024 * 1024,
  onUploadComplete,
  onUploadError,
  show_preview = true,
  className,
  placeholder,
}: FileUploadProps) {
  const t = useTranslations('components.fileUpload')
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const maxSizeMb = Math.round(max_size / 1024 / 1024)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > max_size) {
        const error = t('fileTooLarge', { size: maxSizeMb })
        setErrorMessage(error)
        setStatus('error')
        onUploadError?.(error)
        return
      }

      setFileName(file.name)
      setErrorMessage(null)
      setStatus('uploading')

      if (show_preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(upload_url, {
          method: 'POST',
          body: formData,
        })

        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.message ?? t('uploadFailed'))
        }

        setStatus('success')
        onUploadComplete?.({ url: json.data.url, name: file.name })
      } catch (err) {
        const error = err instanceof Error ? err.message : t('uploadFailed')
        setErrorMessage(error)
        setStatus('error')
        onUploadError?.(error)
      }
    },
    [upload_url, max_size, maxSizeMb, show_preview, onUploadComplete, onUploadError, t]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setStatus('dragging')
  }

  const handleDragLeave = () => {
    setStatus('idle')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setStatus('idle')
    setPreviewUrl(null)
    setFileName(null)
    setErrorMessage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={clsx('w-full', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-200',
          status === 'dragging' && 'border-white bg-neutral-900',
          status === 'uploading' && 'border-neutral-600 opacity-70 pointer-events-none',
          status === 'success' && 'border-green-700',
          status === 'error' && 'border-red-700',
          status === 'idle' && 'border-neutral-800 hover:border-neutral-600'
        )}
      >
        {previewUrl && show_preview && (
          <div className="mb-4 flex justify-center relative h-40 w-full">
            <Image
              src={previewUrl}
              alt={t('previewAlt')}
              fill
              unoptimized
              className="object-contain rounded-sm"
            />
          </div>
        )}

        {status === 'uploading' ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl text-neutral-400">
              progress_activity
            </span>
            <p className="text-xs text-neutral-400">{t('uploading')}</p>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-green-400">check_circle</span>
            <p className="text-xs text-green-400">{t('uploadSuccess', { file: fileName ?? '' })}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="text-[10px] text-neutral-500 hover:text-white underline mt-1"
            >
              {t('uploadNewFile')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-neutral-600">
              cloud_upload
            </span>
            <p className="text-xs text-neutral-500">{placeholder ?? t('placeholder')}</p>
            <p className="text-[10px] text-neutral-700">{t('maxSize', { size: maxSizeMb })}</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
