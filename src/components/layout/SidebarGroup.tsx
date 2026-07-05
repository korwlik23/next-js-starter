'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

const STORAGE_KEY = 'sidebar-groups'

function readState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage blocked — persistence is optional
  }
}

interface SidebarGroupProps {
  id: string
  label: string
  icon: string
  /** True when the current page belongs to this group — forces the group open. */
  active: boolean
  children: ReactNode
}

export function SidebarGroup({ id, label, icon, active, children }: SidebarGroupProps) {
  // Server render must be deterministic: open when active. The saved user
  // preference only applies after mount to avoid a hydration mismatch.
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) {
      setOpen(true)
      return
    }
    const saved = readState()[id]
    setOpen(saved === undefined ? true : saved)
  }, [id, active])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      writeState({ ...readState(), [id]: next })
      return next
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`sidebar-group-${id}`}
        className={clsx(
          'flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-200',
          'hover:bg-[var(--color-surface)]',
          active && 'font-bold'
        )}
        style={{ color: active ? 'var(--color-text)' : 'var(--color-text-subtle)' }}
      >
        <span
          className="material-symbols-outlined text-[1.1rem]"
          style={{ color: active ? 'var(--color-success)' : 'inherit' }}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <span
          className={clsx(
            'material-symbols-outlined text-[1.1rem] transition-transform duration-200',
            open && 'rotate-90'
          )}
          style={{ color: 'var(--color-text-faint)' }}
        >
          chevron_right
        </span>
      </button>
      <div
        id={`sidebar-group-${id}`}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div
            className="ml-[1.35rem] mt-1 flex flex-col gap-1 border-l pl-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
