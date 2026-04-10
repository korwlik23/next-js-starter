// ============================================================
// Unit Test — lib/sanitize.ts
// ตรวจสอบว่าฟังก์ชัน sanitize ป้องกัน XSS และทำความสะอาด input ได้ถูกต้อง
// ============================================================

import {
  SanitizeHtml,
  EscapeHtml,
  SanitizeInput,
  SanitizeEmail,
  SanitizeObject,
} from "@/lib/sanitize";

// ─────────────────────────────────────────────────────────
// SanitizeHtml — ลบ HTML tags ป้องกัน XSS
// ─────────────────────────────────────────────────────────
describe("SanitizeHtml()", () => {
  it("ควรลบ HTML tags ทั้งหมดออก", () => {
    expect(SanitizeHtml("<script>alert('xss')</script>")).toBe(
      "alert('xss')"
    );
  });

  it("ควรลบ HTML tags ที่ซับซ้อนออก", () => {
    expect(SanitizeHtml("<p class='test'>Hello <b>World</b></p>")).toBe(
      "Hello World"
    );
  });

  it("ควรคงข้อความปกติไว้โดยไม่เปลี่ยนแปลง", () => {
    expect(SanitizeHtml("Hello World")).toBe("Hello World");
  });

  it("ควรจัดการกับ string ว่างได้", () => {
    expect(SanitizeHtml("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────
// EscapeHtml — Escape special chars เพื่อแสดงผล HTML
// ─────────────────────────────────────────────────────────
describe("EscapeHtml()", () => {
  it("ควร escape < และ > ให้เป็น HTML entities", () => {
    expect(EscapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("ควร escape & ให้เป็น &amp;", () => {
    expect(EscapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("ควร escape double quotes", () => {
    expect(EscapeHtml('"Hello"')).toBe("&quot;Hello&quot;");
  });

  it("ควรคงข้อความปกติไว้โดยไม่เปลี่ยนแปลง", () => {
    expect(EscapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

// ─────────────────────────────────────────────────────────
// SanitizeInput — ทำความสะอาด input ทั่วไป
// ─────────────────────────────────────────────────────────
describe("SanitizeInput()", () => {
  it("ควร trim whitespace รอบข้อความ", () => {
    expect(SanitizeInput("  hello  ")).toBe("hello");
  });

  it("ควรลบ null bytes ออก", () => {
    expect(SanitizeInput("hello\0world")).toBe("helloworld");
  });

  it("ควรจัดการกับ string ว่างได้", () => {
    expect(SanitizeInput("")).toBe("");
  });

  it("ควรคงข้อความปกติไว้โดยไม่เปลี่ยนแปลง (หลัง trim)", () => {
    expect(SanitizeInput("hello world")).toBe("hello world");
  });
});

// ─────────────────────────────────────────────────────────
// SanitizeEmail — ทำความสะอาด email address
// ─────────────────────────────────────────────────────────
describe("SanitizeEmail()", () => {
  it("ควรแปลง email เป็น lowercase", () => {
    expect(SanitizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("ควร trim whitespace รอบ email ด้วย", () => {
    expect(SanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });
});

// ─────────────────────────────────────────────────────────
// SanitizeObject — ทำความสะอาด object fields
// ─────────────────────────────────────────────────────────
describe("SanitizeObject()", () => {
  it("ควรทำความสะอาด string fields ทั้งหมดใน object", () => {
    const dirty_obj = {
      name: "  <script>John</script>  ",
      age: 25,
      is_active: true,
    };
    const sanitized = SanitizeObject(dirty_obj);
    // name ควรถูก sanitize (ตัด whitespace + ลบ HTML tags)
    expect(sanitized.name).toBe("John");
    // ค่าที่ไม่ใช่ string ไม่ควรเปลี่ยนแปลง
    expect(sanitized.age).toBe(25);
    expect(sanitized.is_active).toBe(true);
  });

  it("ควรไม่แก้ไข object ต้นฉบับ (immutable)", () => {
    const original_obj = { name: "<b>Test</b>" };
    SanitizeObject(original_obj);
    // ต้นฉบับไม่โดนแก้
    expect(original_obj.name).toBe("<b>Test</b>");
  });
});
