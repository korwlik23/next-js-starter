import { clsx } from 'clsx'
import Image from 'next/image'

// ────────────────────────────────────────
// Avatar — คอมโพเนนต์สำหรับแสดงรูปประจำตัว
// ────────────────────────────────────────

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Avatar({ src, alt = 'Avatar', fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }

  // ตัวย่อ fallback ถ้าไม่ส่งมาให้ (เช่น John Doe -> JD)
  const initial = fallback
    ? fallback.substring(0, 2).toUpperCase()
    : alt.substring(0, 1).toUpperCase()

  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 100px"
        />
      ) : (
        <span className="font-bold text-neutral-400 tracking-wider">
          {initial}
        </span>
      )}
    </div>
  )
}
