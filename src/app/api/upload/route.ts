import { NextRequest } from 'next/server'
import { badRequest, serverError, successResponse, unauthorized } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'
import {
  CreateSignedStorageUrl,
  CreateStorageKey,
  PutStorageObject,
  type StorageVisibility,
} from '@/lib/storage'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || 'bin'
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return unauthorized()
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return badRequest('No file provided')
    }

    const extension = getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return badRequest(`File extension not allowed: ${extension}`)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return badRequest(`File type not allowed: ${file.type}`)
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    const visibility: StorageVisibility =
      formData.get('visibility') === 'private' ? 'private' : 'public'
    const fileId = GenerateId()
    const buffer = Buffer.from(await file.arrayBuffer())
    const storedFile = await PutStorageObject({
      key: CreateStorageKey(file.name, fileId),
      body: buffer,
      contentType: file.type,
      visibility,
    })

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        id: fileId,
        tenantId: user.tenantId,
        userId: user.sub,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        disk: storedFile.disk,
        visibility: storedFile.visibility,
        storageKey: storedFile.key,
        url: storedFile.url,
        checksum: storedFile.checksum,
      },
    })

    return successResponse(
      {
        id: uploadedFile.id,
        url: storedFile.url,
        signedUrl:
          storedFile.visibility === 'private' ? CreateSignedStorageUrl(storedFile.key) : undefined,
        name: file.name,
        size: file.size,
        type: file.type,
        disk: storedFile.disk,
        visibility: storedFile.visibility,
        storageKey: storedFile.key,
      },
      'File uploaded successfully'
    )
  } catch (error) {
    logger.error('Upload error', { error })
    return serverError('Failed to upload file')
  }
}
