'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/apiClient'
import { Button, Input, Skeleton } from '@/components/ui'
import { toast } from 'react-hot-toast'
import { Translation } from '@prisma/client'
import { SUPPORTED_LOCALES } from '@/i18n/config'

// ────────────────────────────────────────
// Admin: Translation Management
// ────────────────────────────────────────

const fetchTranslations = async (locale: string) => {
  const result = await api.get<Translation[]>(`/api/admin/translations?locale=${locale}`)
  if (result.error) throw new Error(result.error)
  return result.data || []
}

const saveTranslation = async (data: any) => {
  const result = await api.post('/api/admin/translations', data)
  if (result.error) throw new Error(result.error)

  // Revalidate Cache หลังจากแก้คำแปล สำคัญมาก!
  await fetch('/api/admin/translations/revalidate', { method: 'POST' })
  return result.data
}

export default function TranslationsPage() {
  const queryClient = useQueryClient()
  const [active_locale, setActiveLocale] = useState<string>('th')

  const { data, isLoading } = useQuery({
    queryKey: ['translations', active_locale],
    queryFn: () => fetchTranslations(active_locale),
  })

  // State สำหรับฟอร์มเพิ่มคำแแปลใหม่
  const [new_namespace, setNewNamespace] = useState('')
  const [new_key, setNewKey] = useState('')
  const [new_value, setNewValue] = useState('')

  const mutation = useMutation({
    mutationFn: saveTranslation,
    onSuccess: () => {
      toast.success('บันทึกคำแปลสำเร็จ ระบบอัปเดตหน้าเว็บแล้ว')
      queryClient.invalidateQueries({ queryKey: ['translations'] })
      setNewNamespace('')
      setNewKey('')
      setNewValue('')
    },
    onError: (err) => toast.error(err.message || 'บันทึกล้มเหลว'),
  })

  const HandleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!new_namespace || !new_key || !new_value) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    mutation.mutate({
      locale: active_locale,
      namespace: new_namespace,
      key: new_key,
      value: new_value,
    })
  }

  const HandleQuickEdit = (namespace: string, key: string, new_val: string) => {
    mutation.mutate({
      locale: active_locale,
      namespace,
      key,
      value: new_val,
    })
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--color-primary)]">
          ระบบจัดการภาษา (i18n)
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          แก้ไขคำแปลหรือเพิ่มคำใหม่ คำแปลที่เพิ่มที่นี่จะมีความสำคัญเหนือกว่าไฟล์ JSON
        </p>
      </div>

      <div className="flex w-full sm:w-fit bg-[var(--color-surface-low)] border border-[var(--color-border)] p-1 rounded-[var(--radius-md)] mb-6 gap-1 overflow-x-auto">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveLocale(loc)}
            className={`min-h-10 flex-1 sm:flex-none px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
              active_locale === loc
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
            }`}
          >
            ภาษา {loc.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* เลนส์ขอบซ้าย: ฟอร์มเพิ่ม/แก้ไขด่วน */}
        <div className="lg:col-span-1">
          <form
            onSubmit={HandleSubmit}
            className="editorial-card-elevated p-4 sm:p-5 flex flex-col gap-4 lg:sticky lg:top-20"
          >
            <h2 className="text-lg font-semibold mb-2">เพิ่มคำแปลใหม่</h2>
            <div>
              <label className="text-xs text-[var(--color-text-subtle)] font-medium mb-1.5 block uppercase">
                Namespace
              </label>
              <Input
                placeholder="เช่น auth, common"
                value={new_namespace}
                onChange={(e) => setNewNamespace(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-subtle)] font-medium mb-1.5 block uppercase">
                Key
              </label>
              <Input
                placeholder="เช่น login, title"
                value={new_key}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-subtle)] font-medium mb-1.5 block uppercase">
                Value (คำแปล)
              </label>
              <Input
                placeholder="ใส่คำแปลที่นี่"
                value={new_value}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2" isLoading={mutation.isPending}>
              บันทึกคำแปล
            </Button>
          </form>
        </div>

        {/* เลนส์ขวา: ตารางคำแปลที่มีใน DB */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height="4rem" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="editorial-card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm text-[var(--color-text-muted)]">
                  <thead className="text-xs uppercase bg-[var(--color-surface-low)] border-b border-[var(--color-border)] text-[var(--color-text-subtle)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Namespace</th>
                      <th className="px-4 py-3 font-medium">Key</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium max-w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[var(--color-surface-low)] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs">{item.namespace}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-primary)]">
                          {item.key}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            defaultValue={item.value}
                            onBlur={(e) => {
                              if (e.target.value !== item.value) {
                                HandleQuickEdit(item.namespace, item.key, e.target.value)
                              }
                            }}
                            className="h-9 text-sm bg-transparent hover:border-[var(--color-border-strong)] px-2"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-1 rounded-full uppercase font-bold">
                            In DB
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-low)]">
                * พิมพ์แก้ไขในช่อง Value แล้วคลิกพื้นที่ว่าง (Blur) เพื่อเซฟอัตโนมัติ
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-[var(--color-border)] rounded-[var(--radius-md)] border-dashed">
              <div className="h-12 w-12 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[var(--color-text-faint)]">
                  translate
                </span>
              </div>
              <p className="text-[var(--color-text-muted)] font-medium">ยังไม่มีคำแปลใน Database</p>
              <p className="text-xs text-[var(--color-text-faint)] mt-2">
                คำแปลทั้งหมดจะถูกดึงจากไฟล์ JSON พื้นฐาน
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
