'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import { timeAgo } from '@/utils/format'

interface EnvCheck {
  key: string
  configured: boolean
}

interface OpsSnapshot {
  generated_at: string
  runtime: {
    node_env: string
    log_format: string
    uptime_seconds: number
  }
  readiness: {
    required_env: EnvCheck[]
    optional_integrations: EnvCheck[]
  }
  jobs: {
    configured: boolean
    queueDepth: number | null
    failedDepth: number | null
    error?: string
  }
  sessions: {
    active: number
    expired_not_revoked: number
  }
  webhooks: {
    pending: number
    failed: number
    recent_failures: Array<{
      id: string
      provider: string
      eventId: string
      eventType: string
      createdAt: string
    }>
  }
  emails: {
    queued: number
    failed: number
    recent_failures: Array<{
      id: string
      to: string
      subject: string
      error: string | null
      createdAt: string
    }>
  }
  storage: {
    uploaded_files_24h: number
  }
  health_window: {
    since_1h: string
    since_24h: string
  }
}

async function fetchOpsSnapshot(): Promise<OpsSnapshot> {
  const result = await api.get<OpsSnapshot>('/api/admin/ops')
  if (result.error) throw new Error(result.error)
  if (!result.data) throw new Error('No ops data')
  return result.data
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-black"
      style={{
        color: ok ? 'var(--color-success)' : 'var(--color-error)',
        backgroundColor: ok ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      }}
    >
      {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: string
}) {
  return (
    <div className="editorial-card-elevated p-4 sm:p-5 min-h-[118px]">
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-[10px] font-black uppercase"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          {label}
        </p>
        <span
          className="material-symbols-outlined text-lg"
          style={{ color: 'var(--color-primary)' }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
        {value}
      </p>
    </div>
  )
}

export default function AdminOpsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'ops'],
    queryFn: fetchOpsSnapshot,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const requiredReady = data?.readiness.required_env.every((item) => item.configured) ?? false
  const queueReady = data?.jobs.configured ?? false

  return (
    <div className="mx-auto max-w-6xl pb-12 animate-in fade-in duration-700">
      <header className="mb-6 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="mb-2 text-2xl font-extrabold sm:text-3xl"
              style={{ color: 'var(--color-primary)' }}
            >
              Operations
            </h1>
            <p
              className="max-w-2xl text-base font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Production readiness, background jobs, webhooks, email delivery, and runtime health.
            </p>
          </div>
          {data && (
            <div className="flex flex-wrap gap-2">
              <StatusPill ok={requiredReady} label={requiredReady ? 'Ready' : 'Needs setup'} />
              <StatusPill ok={queueReady} label={queueReady ? 'Queue online' : 'Queue fallback'} />
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-4 text-sm font-medium text-[var(--color-error)]">
          <span className="material-symbols-outlined text-base">error</span>
          {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} height="118px" border_radius="var(--radius-md)" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Active sessions" value={data.sessions.active} icon="devices" />
            <MetricCard
              label="Expired sessions"
              value={data.sessions.expired_not_revoked}
              icon="timer_off"
            />
            <MetricCard label="Webhook backlog" value={data.webhooks.pending} icon="webhook" />
            <MetricCard label="Email queue" value={data.emails.queued} icon="outgoing_mail" />
            <MetricCard label="Queue depth" value={data.jobs.queueDepth ?? '-'} icon="queue" />
            <MetricCard label="Failed jobs" value={data.jobs.failedDepth ?? '-'} icon="error" />
            <MetricCard label="Failed webhooks" value={data.webhooks.failed} icon="sync_problem" />
            <MetricCard
              label="Uploads 24h"
              value={data.storage.uploaded_files_24h}
              icon="upload_file"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="lg:col-span-5">
              <h2
                className="mb-4 text-sm font-black uppercase"
                style={{ color: 'var(--color-primary)' }}
              >
                Environment
              </h2>
              <div className="editorial-card-elevated overflow-hidden">
                {[...data.readiness.required_env, ...data.readiness.optional_integrations].map(
                  (item) => (
                    <div
                      key={item.key}
                      className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 last:border-b-0"
                    >
                      <span
                        className="truncate text-xs font-black"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.key}
                      </span>
                      <StatusPill
                        ok={item.configured}
                        label={item.configured ? 'Set' : 'Missing'}
                      />
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="lg:col-span-7">
              <h2
                className="mb-4 text-sm font-black uppercase"
                style={{ color: 'var(--color-primary)' }}
              >
                Recent Failures
              </h2>
              <div className="space-y-4">
                {[...data.webhooks.recent_failures, ...data.emails.recent_failures].length === 0 ? (
                  <div className="editorial-card-elevated p-10 text-center">
                    <span
                      className="material-symbols-outlined mb-3 text-4xl"
                      style={{ color: 'var(--color-success)' }}
                    >
                      task_alt
                    </span>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                      No webhook or email failures in the last 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    {data.webhooks.recent_failures.map((event) => (
                      <div key={event.id} className="editorial-card-elevated p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p
                            className="text-sm font-black"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {event.provider}: {event.eventType}
                          </p>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: 'var(--color-text-faint)' }}
                          >
                            {timeAgo(event.createdAt, 'en-US')}
                          </span>
                        </div>
                        <p
                          className="mt-1 break-all text-xs font-medium"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {event.eventId}
                        </p>
                      </div>
                    ))}
                    {data.emails.recent_failures.map((email) => (
                      <div key={email.id} className="editorial-card-elevated p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p
                            className="text-sm font-black"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            Email failed: {email.subject}
                          </p>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: 'var(--color-text-faint)' }}
                          >
                            {timeAgo(email.createdAt, 'en-US')}
                          </span>
                        </div>
                        <p
                          className="mt-1 break-all text-xs font-medium"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {email.to}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>
          </div>

          <p className="mt-6 text-xs font-bold" style={{ color: 'var(--color-text-faint)' }}>
            Updated {timeAgo(data.generated_at, 'en-US')} / Runtime {data.runtime.node_env} / Log
            format {data.runtime.log_format}
          </p>
        </>
      ) : null}
    </div>
  )
}
