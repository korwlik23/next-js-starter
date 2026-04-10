// ============================================================
// Jest Setup File — โหลดก่อนรัน Test ทุกไฟล์
// - import custom matchers จาก @testing-library/jest-dom
// - ตั้งค่า global mocks ที่ใช้บ่อย
// ============================================================

import "@testing-library/jest-dom";

// Mock global fetch สำหรับ API call tests
global.fetch = jest.fn();

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers สำหรับ Server Components
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
  }),
}));

// Cleanup หลังแต่ละ test
afterEach(() => {
  jest.clearAllMocks();
});
