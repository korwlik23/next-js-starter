/**
 * ตัวเชื่อมกับบริการแปลภาษาภายนอก
 *
 * ปิดใช้งานโดยปริยาย — ต้องตั้ง AUTO_TRANSLATE_ENDPOINT ก่อนจึงจะเรียกได้
 * รองรับรูปแบบผลลัพธ์หลายแบบเพราะแต่ละผู้ให้บริการตั้งชื่อฟิลด์ไม่เหมือนกัน
 */
export async function translateText(input: {
  text: string
  sourceLocale: string
  targetLocale: string
}) {
  const endpoint = process.env.AUTO_TRANSLATE_ENDPOINT
  if (!endpoint) throw new Error('AUTO_TRANSLATE_NOT_CONFIGURED')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AUTO_TRANSLATE_API_KEY
        ? { Authorization: `Bearer ${process.env.AUTO_TRANSLATE_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      q: input.text,
      source: input.sourceLocale,
      target: input.targetLocale,
      format: 'text',
      api_key: process.env.AUTO_TRANSLATE_API_KEY || undefined,
    }),
  })

  if (!response.ok) throw new Error('AUTO_TRANSLATE_FAILED')

  const data = await response.json()
  const translatedText = data?.translatedText ?? data?.translation ?? data?.text

  if (typeof translatedText !== 'string' || !translatedText.trim()) {
    throw new Error('AUTO_TRANSLATE_EMPTY')
  }

  return translatedText
}
