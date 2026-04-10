// ────────────────────────────────────────
// Object Utilities
// ────────────────────────────────────────

/**
 * รวม Object 2 ตัวเข้าด้วยกัน (Deep Merge)
 * @param target Object ต้นทาง (เช่น JSON ปกติ)
 * @param source Object ที่จะนำมาทับ (เช่น ข้อมูลจาก Database)
 * @returns Object ที่ถูกรวมแล้ว
 */
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(
  target: T,
  source: U
): T & U {
  const result = { ...target } as any

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}
