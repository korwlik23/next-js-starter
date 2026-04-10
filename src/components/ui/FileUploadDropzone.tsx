import { useCallback, useState } from 'react'
import { useDropzone, type DropzoneOptions } from 'react-dropzone'
import { clsx } from 'clsx'

export interface FileUploadDropzoneProps extends DropzoneOptions {
  label?: string
  helperText?: string
  error?: string
  value?: File[]
  onChange?: (files: File[]) => void
  maxFiles?: number
  className?: string
}

export function FileUploadDropzone({
  label,
  helperText,
  error,
  value = [],
  onChange,
  maxFiles = 1,
  className,
  ...dropzoneProps
}: FileUploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>(value)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      let newFiles = [...files, ...acceptedFiles]
      if (maxFiles > 0 && newFiles.length > maxFiles) {
        newFiles = newFiles.slice(0, maxFiles)
      }
      setFiles(newFiles)
      onChange?.(newFiles)
    },
    [files, maxFiles, onChange]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    ...dropzoneProps,
  })

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, i) => i !== indexToRemove)
    setFiles(newFiles)
    onChange?.(newFiles)
  }

  return (
    <div className={clsx('flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-200">
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className={clsx(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive && !isDragReject ? 'border-white bg-neutral-900/50' : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900',
          isDragReject ? 'border-red-500 bg-red-950/20' : '',
          error ? 'border-red-500 bg-red-950/20' : '',
          'cursor-pointer'
        )}
      >
        <input {...getInputProps()} />
        <span className="material-symbols-outlined mb-3 text-4xl text-neutral-400">
          cloud_upload
        </span>
        <p className="mb-1 text-sm font-semibold text-neutral-200">
          {isDragActive ? 'Drop files here...' : 'Click to upload or drag & drop'}
        </p>
        <p className="text-xs text-neutral-500">
          {dropzoneProps.accept
            ? Object.values(dropzoneProps.accept).flat().join(', ')
            : 'Any file type'}
        </p>
      </div>

      {(helperText || error) && (
        <p className={clsx('text-xs', error ? 'text-red-500' : 'text-neutral-500')}>
          {error || helperText}
        </p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-neutral-400">
                  draft
                </span>
                <span className="truncate text-sm text-neutral-200">
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(i)
                }}
                className="ml-2 rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
