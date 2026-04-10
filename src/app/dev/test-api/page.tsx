'use client'

import { useState } from 'react'

const endpoints = [
  { method: 'GET', url: '/api/auth/me', label: 'Auth — Get Current User', needsBody: false },
  {
    method: 'POST',
    url: '/api/auth/login',
    label: 'Auth — Login',
    needsBody: true,
    defaultBody: '{\n  "email": "owner@starter.dev",\n  "password": "password123"\n}',
  },
  { method: 'POST', url: '/api/auth/logout', label: 'Auth — Logout', needsBody: false },
  { method: 'POST', url: '/api/auth/refresh', label: 'Auth — Refresh Token', needsBody: false },
  { method: 'GET', url: '/api/user', label: 'User — List Users', needsBody: false },
  {
    method: 'GET',
    url: '/api/user?page=1&limit=5&search=',
    label: 'User — List with Pagination',
    needsBody: false,
  },
]

interface TestResult {
  status: number
  statusText: string
  data: unknown
  duration: number
}

export default function TestAPIPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0])
  const [customUrl, setCustomUrl] = useState('')
  const [customMethod, setCustomMethod] = useState('GET')
  const [body, setBody] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function runTest(method: string, url: string, reqBody?: string) {
    setIsLoading(true)
    setResult(null)
    const start = performance.now()
    try {
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (reqBody && method !== 'GET') {
        opts.body = reqBody
      }
      const res = await fetch(url, opts)
      const data = await res.json().catch(() => null)
      const duration = Math.round(performance.now() - start)
      setResult({ status: res.status, statusText: res.statusText, data, duration })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      setResult({ status: 0, statusText: 'Network Error', data: String(err), duration })
    } finally {
      setIsLoading(false)
    }
  }

  const methodColors: Record<string, string> = {
    GET: 'text-emerald-400',
    POST: 'text-blue-400',
    PATCH: 'text-yellow-400',
    PUT: 'text-orange-400',
    DELETE: 'text-red-400',
  }

  return (
    <div>
      <header className="mb-10">
        <p
          style={{
            fontSize: '10px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#666',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          Developer
        </p>
        <h1
          style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'white' }}
        >
          API Tester
        </h1>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Test API endpoints interactively
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left — Endpoints */}
        <div>
          <h2
            style={{
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#555',
              fontWeight: 800,
              marginBottom: '16px',
            }}
          >
            Quick Endpoints
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {endpoints.map((ep, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedEndpoint(ep)
                  setBody(ep.defaultBody ?? '')
                  runTest(ep.method, ep.url, ep.defaultBody)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  background: selectedEndpoint === ep ? '#1a1a1a' : 'transparent',
                  border: '1px solid',
                  borderColor: selectedEndpoint === ep ? '#333' : '#111',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#333')}
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = selectedEndpoint === ep ? '#333' : '#111')
                }
              >
                <span
                  className={methodColors[ep.method]}
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    width: '48px',
                  }}
                >
                  {ep.method}
                </span>
                <span style={{ fontSize: '13px', color: '#999' }}>{ep.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Request */}
          <div style={{ marginTop: '32px' }}>
            <h2
              style={{
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#555',
                fontWeight: 800,
                marginBottom: '16px',
              }}
            >
              Custom Request
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/api/..."
                className="editorial-input"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => runTest(customMethod, customUrl, body)}
                disabled={!customUrl || isLoading}
                style={{
                  background: 'white',
                  color: 'black',
                  padding: '8px 20px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: !customUrl || isLoading ? 0.3 : 1,
                }}
              >
                Send
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "key": "value" }'
              rows={5}
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                color: '#aaa',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Right — Response */}
        <div>
          <h2
            style={{
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#555',
              fontWeight: 800,
              marginBottom: '16px',
            }}
          >
            Response
          </h2>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#444' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}
              >
                progress_activity
              </span>
            </div>
          ) : result ? (
            <div style={{ border: '1px solid #1a1a1a', background: '#0a0a0a' }}>
              {/* Status bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color:
                      result.status >= 200 && result.status < 300
                        ? '#22c55e'
                        : result.status >= 400
                          ? '#ef4444'
                          : '#f59e0b',
                  }}
                >
                  {result.status} {result.statusText}
                </span>
                <span style={{ fontSize: '10px', color: '#555', fontWeight: 700 }}>
                  {result.duration}ms
                </span>
              </div>
              {/* Body */}
              <pre
                style={{
                  padding: '16px',
                  margin: 0,
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: '#888',
                  overflow: 'auto',
                  maxHeight: '500px',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#333', fontSize: '13px' }}>
              Click an endpoint or send a custom request
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
