import React from 'react'
import { clsx } from 'clsx'

export interface StatCardProps {
  title: string
  value: string | number
  icon?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={clsx('flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-400">{title}</span>
        {icon && (
          <span className="material-symbols-outlined text-neutral-500">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-4">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-1 text-sm font-medium',
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            <span className="material-symbols-outlined text-base">
              {trend.value >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
