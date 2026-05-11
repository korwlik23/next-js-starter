import { buildOpenApiSpec } from '../../src/lib/openapi'

describe('OpenAPI spec', () => {
  it('exposes core admin and health endpoints', () => {
    const spec = buildOpenApiSpec()

    expect(spec.openapi).toBe('3.1.0')
    expect(spec.paths['/api/health']).toBeDefined()
    expect(spec.paths['/api/admin/ops']).toBeDefined()
    expect(spec.paths['/api/docs/openapi']).toBeDefined()
    expect(spec.components.securitySchemes.cookieAuth).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
    })
  })
})
