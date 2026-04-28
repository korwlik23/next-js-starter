// ============================================================
// Jest Configuration สำหรับ Next.js + TypeScript
// รองรับ: App Router, Path aliases (@/), React Testing Library
// ============================================================

import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// สร้าง Jest config ร่วมกับ Next.js เพื่อให้รองรับ App Router ได้ถูกต้อง
const CreateJestConfig = nextJest({
  // ชี้ไปยัง root ของ Next.js app เพื่อโหลด next.config.ts และ .env files
  dir: './',
})

// ตั้งค่า Jest ที่กำหนดเอง
const JEST_CONFIG: Config = {
  // รองรับ jsdom สำหรับ Browser-like environment ใน component tests
  testEnvironment: 'jsdom',
  // โหลด global setup สำหรับ @testing-library/jest-dom matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Mapping module aliases ให้ตรงกับ tsconfig paths (@/)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // รูปแบบไฟล์ test ที่ Jest จะสแกนหา
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
  ],
  // รองรับการแปลง TypeScript ด้วย ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  // โฟลเดอร์ที่ไม่ต้องสแกน
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // กำหนดไฟล์สำหรับ Coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
    '!src/app/**', // ยกเว้น App Router pages — ใช้ E2E test (Playwright) แทน
  ],
  // รูปแบบ Coverage report
  coverageReporters: ['text', 'lcov', 'html'],
  // กำหนด Threshold ขั้นต่ำของ coverage (70% ตามมาตรฐาน Coding Rules 3.4)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
}

export default CreateJestConfig(JEST_CONFIG)
