'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// FileUpload — คอมโพเนนต์ upload ไฟล์
// รองรับ: Drag & Drop, preview, progress, validation
// ────────────────────────────────────────

interface FileUploadProps {
  /** URL สำหรับ upload (default: /api/upload) */
  upload_url?: string
  /** ประเภทไฟล์ที่อนุญาต (เช่น "image/*,.pdf") */
  accept?: string
  /** ขนาดสูงสุด (bytes) */
  max_size?: number
  /** callback เมื่อ upload สำเร็จ */
  onUploadComplete?: (data: { url: string; name: string }) => void
  /** callback เมื่อ upload ผิดพลาด */
  onUploadError?: (error: string) => void
  /** แสดง preview (สำหรับรูปภาพ) */
  show_preview?: boolean
  /** CSS class เพิ่มเติม */
  className?: string
  /** ข้อความแสดงใน drop zone */
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
  placeholder = 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก',
}: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [preview_url, setPreviewUrl] = useState<string | null>(null)
  const [file_name, setFileName] = useState<string | null>(null)
  const [error_message, setErrorMessage] = useState<string | null>(null)
  const input_ref = useRef<HTMLInputElement>(null)

  // ตรวจสอบและ upload ไฟล์
  const HandleFile = useCallback(
    async (file: File) => {
      // validate ขนาดไฟล์
      if (file.size > max_size) {
        const error = `ไฟล์ใหญ่เกินไป (สูงสุด ${Math.round(max_size / 1024 / 1024)}MB)`
        setErrorMessage(error)
        setStatus('error')
        onUploadError?.(error)
        return
      }

      setFileName(file.name)
      setErrorMessage(null)
      setStatus('uploading')

      // สร้าง preview สำหรับรูปภาพ
      if (show_preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      // Upload ไฟล์
      try {
        const form_data = new FormData()
        form_data.append('file', file)

        const response = await fetch(upload_url, {
          method: 'POST',
          body: form_data,
        })

        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.message ?? 'Upload failed')
        }

        setStatus('success')
        onUploadComplete?.({ url: json.data.url, name: file.name })
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Upload failed'
        setErrorMessage(error)
        setStatus('error')
        onUploadError?.(error)
      }
    },
    [upload_url, max_size, show_preview, onUploadComplete, onUploadError]
  )

  // จัดการ Drag & Drop events
  const HandleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setStatus('dragging')
  }

  const HandleDragLeave = () => {
    setStatus('idle')
  }

  const HandleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) HandleFile(file)
  }

  // จัดการเลือกไฟล์จาก input
  const HandleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) HandleFile(file)
  }

  // Reset state
  const HandleReset = () => {
    setStatus('idle')
    setPreviewUrl(null)
    setFileName(null)
    setErrorMessage(null)
    if (input_ref.current) input_ref.current.value = ''
  }

  return (
    <div className={clsx('w-full', className)}>
      {/* Drop Zone */}
      <div
        onClick={() => input_ref.current?.click()}
        onDragOver={HandleDragOver}
        onDragLeave={HandleDragLeave}
        onDrop={HandleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-200',
          status === 'dragging' && 'border-white bg-neutral-900',
          status === 'uploading' && 'border-neutral-600 opacity-70 pointer-events-none',
          status === 'success' && 'border-green-700',
          status === 'error' && 'border-red-700',
          status === 'idle' && 'border-neutral-800 hover:border-neutral-600'
        )}
      >
        {/* Preview Image */}
        {preview_url && show_preview && (
          <div className="mb-4 flex justify-center relative h-40 w-full">
            <Image
              src={preview_url}
              alt="Preview"
              fill
              unoptimized
              className="object-contain rounded-sm"
            />
          </div>
        )}

        {/* Status Icons & Text */}
        {status === 'uploading' ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl text-neutral-400">
              progress_activity
            </span>
            <p className="text-xs text-neutral-400">กำลังอัพโหลด...</p>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-green-400">check_circle</span>
            <p className="text-xs text-green-400">อัพโหลดสำเร็จ: {file_name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                HandleReset()
              }}
              className="text-[10px] text-neutral-500 hover:text-white underline mt-1"
            >
              อัพโหลดไฟล์ใหม่
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-neutral-600">
              cloud_upload
            </span>
            <p className="text-xs text-neutral-500">{placeholder}</p>
            <p className="text-[10px] text-neutral-700">
              สูงสุด {Math.round(max_size / 1024 / 1024)}MB
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={input_ref}
          type="file"
          accept={accept}
          onChange={HandleInputChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error_message && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error_message}
        </p>
      )}
    </div>
  )
}
