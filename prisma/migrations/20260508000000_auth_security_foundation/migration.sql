-- Add email verification and login brute-force tracking.
ALTER TABLE `users` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

CREATE INDEX `users_emailVerifiedAt_idx` ON `users`(`emailVerifiedAt`);

CREATE TABLE `email_verification_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `email_verification_tokens_tokenHash_key`(`tokenHash`),
  INDEX `email_verification_tokens_userId_idx`(`userId`),
  INDEX `email_verification_tokens_email_idx`(`email`),
  INDEX `email_verification_tokens_expiresAt_idx`(`expiresAt`),
  INDEX `email_verification_tokens_consumedAt_idx`(`consumedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `login_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `identifier` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `failureCount` INTEGER NOT NULL DEFAULT 0,
  `firstFailedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastFailedAt` DATETIME(3) NOT NULL,
  `lockedUntil` DATETIME(3) NULL,

  UNIQUE INDEX `login_attempts_identifier_key`(`identifier`),
  INDEX `login_attempts_email_idx`(`email`),
  INDEX `login_attempts_ipAddress_idx`(`ipAddress`),
  INDEX `login_attempts_lockedUntil_idx`(`lockedUntil`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `email_verification_tokens`
  ADD CONSTRAINT `email_verification_tokens_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `user_mfa_settings` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `secretEncrypted` TEXT NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `confirmedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `user_mfa_settings_userId_key`(`userId`),
  INDEX `user_mfa_settings_enabled_idx`(`enabled`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mfa_challenges` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `mfa_challenges_userId_idx`(`userId`),
  INDEX `mfa_challenges_expiresAt_idx`(`expiresAt`),
  INDEX `mfa_challenges_consumedAt_idx`(`consumedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mfa_recovery_codes` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `mfa_recovery_codes_codeHash_key`(`codeHash`),
  INDEX `mfa_recovery_codes_userId_idx`(`userId`),
  INDEX `mfa_recovery_codes_usedAt_idx`(`usedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_mfa_settings`
  ADD CONSTRAINT `user_mfa_settings_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mfa_challenges`
  ADD CONSTRAINT `mfa_challenges_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mfa_recovery_codes`
  ADD CONSTRAINT `mfa_recovery_codes_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
