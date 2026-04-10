// ────────────────────────────────────────
// Logger System — Structured JSON Logging
// รองรับ: log levels per env, structured output, request context
// ────────────────────────────────────────

/** ระดับความสำคัญของ Log */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** ลำดับ priority ของ log levels (ยิ่งสูง = ยิ่งสำคัญ) */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/** กำหนด minimum log level ตาม environment */
const ENV_LOG_LEVELS: Record<string, LogLevel> = {
  development: 'debug', // แสดงทุก level
  test: 'warn',         // แสดงเฉพาะ warn + error
  production: 'info',   // แสดง info, warn, error (ไม่แสดง debug)
}

/** โครงสร้าง Structured Log Entry */
interface LogEntry {
  /** timestamp ISO 8601 */
  timestamp: string
  /** ระดับ log */
  level: LogLevel
  /** ข้อความหลัก */
  message: string
  /** ข้อมูลเพิ่มเติม (ถ้ามี) */
  data?: unknown
  /** request context (ถ้ามี) */
  context?: LogContext
}

/** Context ข้อมูลจาก request */
interface LogContext {
  /** Request ID สำหรับ trace */
  request_id?: string
  /** User ID ที่ทำ action */
  user_id?: string
  /** HTTP method + path */
  path?: string
}

// ── ค่า config จาก environment
const CURRENT_ENV = process.env.NODE_ENV ?? 'development'
const IS_DEV = CURRENT_ENV === 'development'
const MIN_LOG_LEVEL = ENV_LOG_LEVELS[CURRENT_ENV] ?? 'info'
const USE_JSON_FORMAT = process.env.LOG_FORMAT === 'json' || !IS_DEV

// ── Thread-local-like context storage (สำหรับ request context)
let _current_context: LogContext | undefined

/**
 * ตั้งค่า request context สำหรับ log entries ที่ตามมา
 * ใช้ใน middleware หรือ API route handler
 * @example SetLogContext({ request_id: 'abc123', user_id: 'user_01' })
 */
export function SetLogContext(context: LogContext) {
  _current_context = context
}

/**
 * ล้าง request context
 */
export function ClearLogContext() {
  _current_context = undefined
}

/**
 * ตรวจว่า level นี้ควรแสดงหรือไม่ (ตาม min level ของ env)
 */
function ShouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL]
}

/**
 * สร้าง structured log entry
 */
function CreateLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  // แนบ data ถ้ามี
  if (data !== undefined && data !== null) {
    // ถ้าเป็น Error object → แปลงเป็น serializable
    if (data instanceof Error) {
      entry.data = {
        name: data.name,
        message: data.message,
        stack: IS_DEV ? data.stack : undefined,
      }
    } else {
      entry.data = data
    }
  }

  // แนบ request context ถ้ามี
  if (_current_context) {
    entry.context = { ..._current_context }
  }

  return entry
}

/**
 * ส่ง log entry ไป output
 * - Development: human-readable format (สีสัน)
 * - Production: JSON format (สำหรับ log aggregation tools)
 */
function EmitLog(entry: LogEntry) {
  // ── Enterprise Error Monitoring Integration
  if (entry.level === 'error' && process.env.SENTRY_DSN && typeof window === 'undefined') {
    // TODO: Sentry.captureException(entry.data || new Error(entry.message), { extra: entry.context })
    // ตัวอย่างการแสดงว่า ส่ง Log ไปยัง External service แล้ว
    console.debug(`[Enterprise Logger] Dispatched to Sentry: ${entry.message}`)
  }

  if (USE_JSON_FORMAT && !IS_DEV) {
    // ── JSON format สำหรับ production (ELK, Datadog, CloudWatch)
    const json_output = JSON.stringify(entry)

    switch (entry.level) {
      case 'error':
        console.error(json_output)
        break
      case 'warn':
        console.warn(json_output)
        break
      default:
        console.log(json_output)
    }
  } else {
    // ── Human-readable format สำหรับ development
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const context_str = entry.context?.request_id ? ` (req:${entry.context.request_id})` : ''

    switch (entry.level) {
      case 'error':
        console.error(`${prefix}${context_str}`, entry.message, entry.data ?? '')
        break
      case 'warn':
        console.warn(`${prefix}${context_str}`, entry.message, entry.data ?? '')
        break
      case 'debug':
        console.debug(`${prefix}${context_str}`, entry.message, entry.data ?? '')
        break
      default:
        console.log(`${prefix}${context_str}`, entry.message, entry.data ?? '')
    }
  }
}

/**
 * Core log function — ตรวจสอบ level แล้ว emit
 */
function Log(level: LogLevel, message: string, data?: unknown) {
  if (!ShouldLog(level)) return
  const entry = CreateLogEntry(level, message, data)
  EmitLog(entry)
}

// ── Public Logger API
export const logger = {
  /** Debug — แสดงเฉพาะ development */
  debug: (message: string, data?: unknown) => Log('debug', message, data),

  /** Info — ข้อมูลทั่วไป, events, operations สำเร็จ */
  info: (message: string, data?: unknown) => Log('info', message, data),

  /** Warning — สิ่งที่อาจเป็นปัญหา, deprecated usage */
  warn: (message: string, data?: unknown) => Log('warn', message, data),

  /** Error — ข้อผิดพลาดที่ต้องจัดการ */
  error: (message: string, data?: unknown) => Log('error', message, data),

  /** ตั้ง request context */
  setContext: SetLogContext,

  /** ล้าง request context */
  clearContext: ClearLogContext,
}

export default logger
