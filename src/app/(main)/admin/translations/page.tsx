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
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">ระบบจัดการภาษา (i18n)</h1>
        <p className="text-sm text-neutral-500">
          แก้ไขคำแปลหรือเพิ่มคำใหม่ คำแปลที่เพิ่มที่นี่จะมีความสำคัญเหนือกว่าไฟล์ JSON
        </p>
      </div>

      <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg w-fit mb-8 gap-1">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveLocale(loc)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              active_locale === loc
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            ภาษา {loc.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* เลนส์ขอบซ้าย: ฟอร์มเพิ่ม/แก้ไขด่วน */}
        <div className="lg:col-span-1">
          <form onSubmit={HandleSubmit} className="p-6 rounded-xl border border-neutral-800 bg-neutral-950/50 flex flex-col gap-4 sticky top-6">
            <h2 className="text-lg font-semibold mb-2">เพิ่มคำแปลใหม่</h2>
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block uppercase tracking-wider">Namespace</label>
              <Input
                placeholder="เช่น auth, common"
                value={new_namespace}
                onChange={(e) => setNewNamespace(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block uppercase tracking-wider">Key</label>
              <Input
                placeholder="เช่น login, title"
                value={new_key}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block uppercase tracking-wider">Value (คำแปล)</label>
              <Input
                placeholder="ใส่คำแปลที่นี่"
                value={new_value}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="mt-4"
              isLoading={mutation.isPending}
            >
              บันทึกคำแปล
            </Button>
          </form>
        </div>

        {/* เลนส์ขวา: ตารางคำแปลที่มีใน DB */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="4rem" />)}
            </div>
          ) : data && data.length > 0 ? (
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/50">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="text-xs uppercase bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Namespace</th>
                    <th className="px-4 py-3 font-medium">Key</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium max-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{item.namespace}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white">{item.key}</td>
                      <td className="px-4 py-3">
                        <Input 
                          defaultValue={item.value}
                          onBlur={(e) => {
                            if(e.target.value !== item.value) {
                              HandleQuickEdit(item.namespace, item.key, e.target.value)
                            }
                          }}
                          className="h-8 text-sm bg-transparent border-transparent hover:border-neutral-700 focus:bg-neutral-900 px-2"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full uppercase tracking-wider font-bold">In DB</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-neutral-800 text-xs text-neutral-500 bg-neutral-950">
                * พิมพ์แก้ไขในช่อง Value แล้วคลิกพื้นที่ว่าง (Blur) เพื่อเซฟอัตโนมัติ
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-neutral-800 rounded-xl border-dashed">
              <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-neutral-400">translate</span>
              </div>
              <p className="text-neutral-400 font-medium">ยังไม่มีคำแปลใน Database</p>
              <p className="text-xs text-neutral-600 mt-2">คำแปลทั้งหมดจะถูกดึงจากไฟล์ JSON พื้นฐาน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
