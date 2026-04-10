// ============================================================
// Unit Test — lib/ulid.ts
// ตรวจสอบว่า ULID generation และ timestamp extraction ทำงานถูกต้อง
// ============================================================

import { GenerateId, GenerateIdWithTime, ExtractTimestamp } from "@/lib/ulid";

describe("GenerateId()", () => {
  it("ควรสร้าง ID ที่มีความยาวถูกต้อง (26 ตัวอักษร)", () => {
    const ulid_id = GenerateId();
    expect(ulid_id).toHaveLength(26);
  });

  it("ควรสร้าง ID ที่แตกต่างกันทุกครั้ง", () => {
    const first_id = GenerateId();
    const second_id = GenerateId();
    expect(first_id).not.toBe(second_id);
  });

  it("ควรสร้าง ID ที่มีแค่ตัวอักษร Crockford Base32 เท่านั้น", () => {
    const ulid_id = GenerateId();
    // ULID ใช้ Crockford Base32: 0-9 และ A-Z ยกเว้น I, L, O, U
    expect(ulid_id).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
  });
});

describe("GenerateIdWithTime()", () => {
  it("ควรสร้าง ID ด้วย timestamp ที่กำหนดได้", () => {
    const fixed_timestamp = 1700000000000; // Nov 2023 — timestamp ที่รู้จัก
    const ulid_id = GenerateIdWithTime(fixed_timestamp);
    expect(ulid_id).toHaveLength(26);
  });

  it("สอง ID ที่ใช้ timestamp เดียวกัน ควรขึ้นต้น (10 chars) เหมือนกัน", () => {
    const fixed_timestamp = 1700000000000;
    const first_id = GenerateIdWithTime(fixed_timestamp);
    const second_id = GenerateIdWithTime(fixed_timestamp);
    // 10 ตัวแรกคือ timestamp part
    expect(first_id.substring(0, 10)).toBe(second_id.substring(0, 10));
  });
});

describe("ExtractTimestamp()", () => {
  it("ควรดึง timestamp ออกมาใกล้เคียงกับเวลาที่สร้าง", () => {
    const before_create = Date.now();
    const ulid_id = GenerateId();
    const after_create = Date.now();

    const extracted_timestamp = ExtractTimestamp(ulid_id);
    // Timestamp ที่ดึงออกมาควรอยู่ระหว่าง before และ after
    expect(extracted_timestamp).toBeGreaterThanOrEqual(before_create);
    expect(extracted_timestamp).toBeLessThanOrEqual(after_create + 1);
  });

  it("ควรดึง timestamp ที่กำหนดเองได้ถูกต้อง", () => {
    const fixed_timestamp = 1700000000000;
    const ulid_with_time = GenerateIdWithTime(fixed_timestamp);
    const extracted = ExtractTimestamp(ulid_with_time);
    expect(extracted).toBe(fixed_timestamp);
  });
});
