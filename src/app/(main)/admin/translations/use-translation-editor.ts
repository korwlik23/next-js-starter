'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { saveTranslationRequest } from './api'
import type { Translation } from './types'

type Messages = {
  editOnlyHint: string
  requiredField: string
  updateSuccess: string
  saveError: string
}

/**
 * ฟอร์มแก้คำแปลทีละรายการ
 *
 * แก้ได้เฉพาะรายการที่มีอยู่ในแคตตาล็อกฐานแล้วเท่านั้น การเพิ่ม key ใหม่
 * ต้องทำผ่านไฟล์ข้อความ ไม่ใช่หน้านี้
 */
export function useTranslationEditor(messages: Messages, onSaved: () => Promise<void> | void) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Translation | null>(null)
  const [translationValue, setTranslationValue] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleOpenModal(item: Translation) {
    setFormError('')
    setEditingItem(item)
    setTranslationValue(item.value ?? '')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setIsModalOpen(false)
    setEditingItem(null)
    setFormError('')
    setTranslationValue('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!editingItem) {
      setFormError(messages.editOnlyHint)
      return
    }
    if (!translationValue.trim()) {
      setFormError(messages.requiredField)
      return
    }

    setSaving(true)
    try {
      const res = await saveTranslationRequest({
        locale: editingItem.locale,
        namespace: editingItem.namespace,
        key: editingItem.key,
        value: translationValue,
      })

      if (res.error) {
        setFormError(res.error)
        toast.error(res.error)
        return
      }

      toast.success(messages.updateSuccess)
      setIsModalOpen(false)
      setEditingItem(null)
      setFormError('')
      setTranslationValue('')
      await onSaved()
    } catch {
      setFormError(messages.saveError)
      toast.error(messages.saveError)
    } finally {
      setSaving(false)
    }
  }

  return {
    isModalOpen,
    editingItem,
    translationValue,
    setTranslationValue,
    formError,
    saving,
    handleOpenModal,
    closeModal,
    handleSubmit,
  }
}
