import { appConfig } from '@/config'

const jsonResponse = {
  description: 'Standard JSON response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ApiResponse',
      },
    },
  },
}

export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: `${appConfig.name} API`,
      version: appConfig.version,
      description:
        'Core API surface for auth, tenancy, RBAC, billing, storage, audit logs, admin operations, and health checks.',
    },
    servers: [
      {
        url: appConfig.url,
      },
    ],
    security: [{ cookieAuth: [] }],
    paths: {
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Read system health checks',
          security: [],
          responses: {
            '200': jsonResponse,
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Sign in with email and password',
          security: [],
          responses: {
            '200': jsonResponse,
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Create a user and workspace',
          security: [],
          responses: {
            '201': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Read the current authenticated user',
          responses: {
            '200': jsonResponse,
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/verify-email': {
        get: {
          tags: ['Auth'],
          summary: 'Verify an email address from an email link',
          security: [],
          parameters: [
            {
              name: 'token',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '303': {
              description: 'Redirects to login with verification status',
            },
          },
        },
        post: {
          tags: ['Auth'],
          summary: 'Verify an email address with a JSON token',
          security: [],
          responses: {
            '200': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/auth/verify-email/resend': {
        post: {
          tags: ['Auth'],
          summary: 'Resend an email verification link for the authenticated user',
          responses: {
            '200': jsonResponse,
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/mfa/setup': {
        post: {
          tags: ['Auth'],
          summary: 'Start MFA setup for the authenticated user',
          responses: {
            '200': jsonResponse,
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/mfa/confirm': {
        post: {
          tags: ['Auth'],
          summary: 'Confirm MFA setup with a TOTP code',
          responses: {
            '200': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/mfa/disable': {
        post: {
          tags: ['Auth'],
          summary: 'Disable MFA with a current TOTP code',
          responses: {
            '200': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/mfa/verify': {
        post: {
          tags: ['Auth'],
          summary: 'Complete login with an MFA challenge and TOTP or recovery code',
          security: [],
          responses: {
            '200': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/user': {
        get: {
          tags: ['Users'],
          summary: 'List users',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a user',
          responses: {
            '201': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/tenant': {
        get: {
          tags: ['Tenants'],
          summary: 'Read tenant details',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/billing': {
        get: {
          tags: ['Billing'],
          summary: 'Read subscription and plan state',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/storage/file': {
        post: {
          tags: ['Storage'],
          summary: 'Upload a file',
          responses: {
            '201': jsonResponse,
            '400': { $ref: '#/components/responses/BadRequest' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/audit': {
        get: {
          tags: ['Audit'],
          summary: 'List audit events',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Read admin dashboard metrics',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/admin/ops': {
        get: {
          tags: ['Admin'],
          summary: 'Read operational readiness and queue health',
          responses: {
            '200': jsonResponse,
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/docs/openapi': {
        get: {
          tags: ['System'],
          summary: 'Read this OpenAPI document',
          responses: {
            '200': {
              description: 'OpenAPI JSON document',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Use Bearer tokens or project API keys where supported.',
        },
      },
      responses: {
        BadRequest: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Authentication is required or expired',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        Forbidden: {
          description: 'The current user lacks the required permission',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            code: { type: 'string' },
            data: {},
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          required: ['success'],
        },
      },
    },
  } as const
}
