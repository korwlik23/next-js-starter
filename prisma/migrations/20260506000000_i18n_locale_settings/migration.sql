ALTER TABLE `translations`
  MODIFY `value` TEXT NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'published',
  ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
  ADD COLUMN `reviewedAt` DATETIME(3) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

CREATE INDEX `translations_locale_status_idx` ON `translations`(`locale`, `status`);
CREATE INDEX `translations_status_idx` ON `translations`(`status`);

CREATE TABLE IF NOT EXISTS `locales` (
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `nativeName` VARCHAR(191) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `fallbackLocale` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`code`),
  KEY `locales_enabled_idx` (`enabled`),
  KEY `locales_isDefault_idx` (`isDefault`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `i18n_settings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'global',
  `langMode` VARCHAR(191) NOT NULL DEFAULT 'switch',
  `defaultLocale` VARCHAR(191) NOT NULL DEFAULT 'th',
  `switchLocaleA` VARCHAR(191) NOT NULL DEFAULT 'th',
  `switchLocaleB` VARCHAR(191) NOT NULL DEFAULT 'en',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `locales` (`code`, `name`, `nativeName`, `enabled`, `isDefault`, `fallbackLocale`, `createdAt`, `updatedAt`)
VALUES
  ('th', 'Thai', 'ไทย', true, true, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('en', 'English', 'English', true, false, 'th', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `nativeName` = VALUES(`nativeName`),
  `enabled` = VALUES(`enabled`),
  `fallbackLocale` = VALUES(`fallbackLocale`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

INSERT INTO `i18n_settings` (`id`, `langMode`, `defaultLocale`, `switchLocaleA`, `switchLocaleB`, `createdAt`, `updatedAt`)
VALUES ('global', 'switch', 'th', 'th', 'en', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `langMode` = VALUES(`langMode`),
  `defaultLocale` = VALUES(`defaultLocale`),
  `switchLocaleA` = VALUES(`switchLocaleA`),
  `switchLocaleB` = VALUES(`switchLocaleB`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
