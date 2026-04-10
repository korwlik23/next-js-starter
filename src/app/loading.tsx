// ────────────────────────────────────────
// Loading Page — ตาม editorial design
// Spinner + label แบบ minimal
// ────────────────────────────────────────

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner icon — หมุน */}
        <span
          className="material-symbols-outlined animate-spin text-4xl"
          style={{ color: 'var(--color-text-faint)' }}
        >
          progress_activity
        </span>
        {/* Loading label */}
        <p className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          Loading
        </p>
      </div>
    </div>
  )
}
