'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchTranslationsRequest } from './api'
import { ALL, type Translation } from './types'

/**
 * รายการคำแปลของภาษาที่เลือก พร้อมตัวกรองและค่าสรุป
 *
 * ถือ `currentLocale` ไว้เองเพราะการเปลี่ยนภาษาคือการโหลดรายการใหม่
 * ส่วนที่อื่นเรียก `setCurrentLocale` เพื่อสั่งย้ายภาษาได้
 */
export function useTranslationCatalog(initialLocale = 'th', errorMessage = '') {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentLocale, setCurrentLocale] = useState(initialLocale)
  const [selectedNamespace, setSelectedNamespace] = useState<string>(ALL)
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL)
  const [search, setSearch] = useState('')

  const fetchTranslations = useCallback(
    async (locale: string = currentLocale) => {
      setLoading(true)
      setError('')

      try {
        const res = await fetchTranslationsRequest(locale)

        if (res.error) {
          setTranslations([])
          setError(res.error)
          toast.error(res.error)
          return
        }

        setTranslations(res.data ?? [])
      } catch {
        setTranslations([])
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [currentLocale, errorMessage]
  )

  useEffect(() => {
    fetchTranslations(currentLocale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale])

  const namespaces = useMemo(
    () =>
      Array.from(new Set(translations.map((item) => item.namespace))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [translations]
  )

  const namespaceCounts = useMemo(
    () =>
      translations.reduce<Record<string, number>>((counts, item) => {
        counts[item.namespace] = (counts[item.namespace] ?? 0) + 1
        return counts
      }, {}),
    [translations]
  )

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()

    return translations.filter((item) => {
      const matchesNamespace = selectedNamespace === ALL || item.namespace === selectedNamespace
      const matchesStatus = selectedStatus === ALL || item.status === selectedStatus
      const matchesSearch =
        !query ||
        item.key.toLowerCase().includes(query) ||
        item.effectiveValue.toLowerCase().includes(query) ||
        item.baseValue.toLowerCase().includes(query) ||
        item.namespace.toLowerCase().includes(query)

      return matchesNamespace && matchesStatus && matchesSearch
    })
  }, [search, selectedNamespace, selectedStatus, translations])

  const stats = useMemo(
    () => ({
      total: translations.length,
      namespaces: namespaces.length,
      missing: translations.filter((item) => item.status === 'missing').length,
      published: translations.filter((item) => item.status === 'published').length,
    }),
    [namespaces.length, translations]
  )

  return {
    translations,
    loading,
    error,
    currentLocale,
    setCurrentLocale,
    selectedNamespace,
    setSelectedNamespace,
    selectedStatus,
    setSelectedStatus,
    search,
    setSearch,
    fetchTranslations,
    namespaces,
    namespaceCounts,
    filteredData,
    stats,
  }
}
