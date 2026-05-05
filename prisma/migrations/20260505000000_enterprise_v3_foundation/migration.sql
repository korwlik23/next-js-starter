CREATE TABLE IF NOT EXISTS `tenant_memberships` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_memberships_tenantId_userId_key` (`tenantId`, `userId`),
  KEY `tenant_memberships_tenantId_status_idx` (`tenantId`, `status`),
  KEY `tenant_memberships_userId_idx` (`userId`),
  KEY `tenant_memberships_roleId_idx` (`roleId`),
  KEY `tenant_memberships_deletedAt_idx` (`deletedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_tokenHash_key` (`tokenHash`),
  KEY `sessions_userId_idx` (`userId`),
  KEY `sessions_expiresAt_idx` (`expiresAt`),
  KEY `sessions_revokedAt_idx` (`revokedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webhook_events` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `payload` JSON NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `webhook_events_provider_eventId_key` (`provider`, `eventId`),
  KEY `webhook_events_provider_eventType_idx` (`provider`, `eventType`),
  KEY `webhook_events_status_idx` (`status`),
  KEY `webhook_events_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uploaded_files` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `size` INTEGER NOT NULL,
  `disk` VARCHAR(191) NOT NULL DEFAULT 'local',
  `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
  `storageKey` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NULL,
  `checksum` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_files_tenantId_idx` (`tenantId`),
  KEY `uploaded_files_userId_idx` (`userId`),
  KEY `uploaded_files_disk_idx` (`disk`),
  KEY `uploaded_files_visibility_idx` (`visibility`),
  KEY `uploaded_files_storageKey_idx` (`storageKey`),
  KEY `uploaded_files_deletedAt_idx` (`deletedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NULL,
  `to` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `template` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
  `provider` VARCHAR(191) NULL,
  `messageId` VARCHAR(191) NULL,
  `error` TEXT NULL,
  `sentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `email_logs_tenantId_idx` (`tenantId`),
  KEY `email_logs_userId_idx` (`userId`),
  KEY `email_logs_status_idx` (`status`),
  KEY `email_logs_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `impersonation_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `actorUserId` VARCHAR(191) NOT NULL,
  `targetUserId` VARCHAR(191) NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `impersonation_sessions_actorUserId_idx` (`actorUserId`),
  KEY `impersonation_sessions_targetUserId_idx` (`targetUserId`),
  KEY `impersonation_sessions_expiresAt_idx` (`expiresAt`),
  KEY `impersonation_sessions_revokedAt_idx` (`revokedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
