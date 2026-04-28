'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Checkbox,
  RadioGroup as Radio,
  Modal,
  ConfirmModal,
  Drawer,
  Dropdown,
  Tooltip,
  Tabs,
  Accordion,
  Badge,
  Avatar,
  Spinner as Loader,
  Skeleton,
  SkeletonCard,
  Switch,
} from '@/components/ui'

// ────────────────────────────────────────
// /dev/ui — Component Library Showcase
// import จาก @/components/ui จริงทั้งหมด
// ใช้ CSS variables → รองรับ light + dark mode
// ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2
        className="text-xs font-extrabold uppercase tracking-widest mb-6 pb-4"
        style={{
          color: 'var(--color-text-subtle)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {title}
      </h2>
      <div className="flex flex-wrap gap-4 items-start">{children}</div>
    </section>
  )
}

export default function DevUIPage() {
  // ── Modal state
  const [modal_open, setModalOpen] = useState(false)
  const [confirm_open, setConfirmOpen] = useState(false)

  // ── Drawer state
  const [drawer_open, setDrawerOpen] = useState(false)

  // ── Checkbox state
  const [check_a, setCheckA] = useState(false)
  const [check_b, setCheckB] = useState(true)

  // ── Radio state
  const [radio_val, setRadioVal] = useState('option1')

  // ── Switch state
  const [sw_a, setSwA] = useState(false)
  const [sw_b, setSwB] = useState(true)

  // ── Select state
  const [sel_val, setSelVal] = useState('')

  return (
    <div>
      {/* ── Page Header */}
      <header className="mb-12">
        <p className="label-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
          Developer
        </p>
        <h1
          className="text-4xl font-extrabold tracking-tighter"
          style={{ color: 'var(--color-primary)' }}
        >
          UI Component Library
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          All reusable components from{' '}
          <code
            className="text-xs font-mono px-1 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-surface-high)',
              color: 'var(--color-primary)',
            }}
          >
            @/components/ui
          </code>
        </p>
      </header>

      {/* ─────────── BUTTON ─────────── */}
      <Section title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" isLoading>
          Loading
        </Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
      </Section>

      {/* ─────────── BADGE ─────────── */}
      <Section title="Badge">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </Section>

      {/* ─────────── AVATAR ─────────── */}
      <Section title="Avatar">
        <Avatar alt="Admin User" size="sm" />
        <Avatar alt="John Doe" fallback="JD" size="md" />
        <Avatar alt="Super Admin" fallback="SA" size="lg" />
        <Avatar alt="XL User" fallback="XL" size="xl" />
        <Avatar src="https://i.pravatar.cc/100?img=5" alt="With Photo" size="md" />
      </Section>

      {/* ─────────── INPUT ─────────── */}
      <Section title="Input">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Default Input" placeholder="Type something..." id="input-default" />
          <Input
            label="With Error"
            placeholder="Invalid input"
            id="input-error"
            error="This field is required"
          />
          <Input label="Disabled" placeholder="Disabled" id="input-disabled" disabled />
          <Input label="Password" type="password" placeholder="••••••••" id="input-password" />
        </div>
      </Section>

      {/* ─────────── SELECT ─────────── */}
      <Section title="Select">
        <div className="w-64">
          <Select
            label="Choose option"
            id="select-demo"
            value={sel_val}
            onChange={(e) => setSelVal(e.target.value)}
            options={[
              { label: 'Option A', value: 'a' },
              { label: 'Option B', value: 'b' },
              { label: 'Option C', value: 'c' },
            ]}
          />
        </div>
      </Section>

      {/* ─────────── CHECKBOX ─────────── */}
      <Section title="Checkbox">
        <div className="flex flex-col gap-3">
          <Checkbox
            id="check-a"
            label="Unchecked item"
            checked={check_a}
            onChange={(e) => setCheckA(e.target.checked)}
          />
          <Checkbox
            id="check-b"
            label="Checked item"
            checked={check_b}
            onChange={(e) => setCheckB(e.target.checked)}
          />
          <Checkbox
            id="check-c"
            label="Disabled item"
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>
      </Section>

      {/* ─────────── RADIO ─────────── */}
      <Section title="Radio">
        <Radio
          name="demo-radio"
          value={radio_val}
          on_change={setRadioVal}
          options={[
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3 (disabled)', value: 'option3', is_disabled: true },
          ]}
        />
      </Section>

      {/* ─────────── SWITCH ─────────── */}
      <Section title="Switch">
        <div className="flex flex-col gap-3">
          <Switch id="switch-a" label="Notifications" checked={sw_a} onCheckedChange={setSwA} />
          <Switch
            id="switch-b"
            label="Dark Mode (enabled)"
            checked={sw_b}
            onCheckedChange={setSwB}
            variant="success"
          />
          <Switch
            id="switch-c"
            label="Disabled switch"
            checked={false}
            onCheckedChange={() => {}}
            disabled
          />
        </div>
      </Section>

      {/* ─────────── TOOLTIP ─────────── */}
      <Section title="Tooltip">
        <Tooltip content="Tooltip on top" position="top">
          <Button variant="secondary">Top</Button>
        </Tooltip>
        <Tooltip content="Tooltip on bottom" position="bottom">
          <Button variant="secondary">Bottom</Button>
        </Tooltip>
        <Tooltip content="Tooltip on left" position="left">
          <Button variant="secondary">Left</Button>
        </Tooltip>
        <Tooltip content="Tooltip on right" position="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
      </Section>

      {/* ─────────── DROPDOWN ─────────── */}
      <Section title="Dropdown">
        <Dropdown
          trigger={<Button variant="secondary">Open Menu ▾</Button>}
          items={[
            { label: 'View Profile', icon: 'person', onClick: () => {} },
            { label: 'Edit', icon: 'edit', onClick: () => {} },
            { is_divider: true, label: '' },
            { label: 'Delete', icon: 'delete', is_danger: true, onClick: () => {} },
          ]}
          align="left"
        />
      </Section>

      {/* ─────────── TABS ─────────── */}
      <Section title="Tabs">
        <div className="w-full">
          <Tabs
            items={[
              {
                value: 'overview',
                label: 'Overview',
                icon: 'dashboard',
                content: (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Overview tab — แสดงข้อมูลสรุปของระบบ
                  </p>
                ),
              },
              {
                value: 'settings',
                label: 'Settings',
                icon: 'settings',
                content: (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Settings tab — ตั้งค่าต่างๆ ของระบบ
                  </p>
                ),
              },
              {
                value: 'logs',
                label: 'Logs',
                icon: 'history',
                content: (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Logs tab — ดู audit log ของระบบ
                  </p>
                ),
              },
              {
                value: 'disabled',
                label: 'Disabled',
                disabled: true,
                content: <></>,
              },
            ]}
          />
        </div>
      </Section>

      {/* ─────────── ACCORDION ─────────── */}
      <Section title="Accordion">
        <div className="w-full max-w-xl">
          <Accordion
            items={[
              {
                id: 'q1',
                title: 'What is this starter template?',
                content:
                  'Ultimate Next.js Starter — Production-ready fullstack template with Auth, RBAC, i18n, SaaS features.',
              },
              {
                id: 'q2',
                title: 'What database does it use?',
                content: 'MySQL via XAMPP (database: nextjs_starter) with Prisma ORM.',
              },
              {
                id: 'q3',
                title: 'Does it support multi-tenant?',
                content: 'Yes! tenantId is on every table. Enable in config to activate.',
              },
              {
                id: 'q4',
                title: 'Disabled item',
                content: 'This should not open.',
                is_disabled: true,
              },
            ]}
            default_open={['q1']}
          />
        </div>
      </Section>

      {/* ─────────── MODAL ─────────── */}
      <Section title="Modal / Dialog">
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Confirm Modal
        </Button>

        {/* Standard Modal */}
        <Modal is_open={modal_open} onClose={() => setModalOpen(false)} title="Example Modal">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Reusable Modal จาก <code>@/components/ui</code>. รองรับ ESC, click overlay, portal
            render.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>

        {/* Confirm Modal */}
        <ConfirmModal
          is_open={confirm_open}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Delete Confirmation"
          message="คุณแน่ใจหรือไม่ที่จะลบรายการนี้? การกระทำนี้ไม่สามารถยกเลิกได้"
          confirm_text="ลบเลย"
          cancel_text="ยกเลิก"
          variant="danger"
        />
      </Section>

      {/* ─────────── DRAWER ─────────── */}
      <Section title="Drawer">
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open Drawer →
        </Button>

        <Drawer is_open={drawer_open} onClose={() => setDrawerOpen(false)} title="Side Drawer">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Drawer เลื่อนออกมาจากด้านขวา รองรับ scroll content ยาวๆ
            </p>
            <Input label="Name" placeholder="Enter name..." id="drawer-input" />
            <Button variant="primary" className="w-full" onClick={() => setDrawerOpen(false)}>
              Save &amp; Close
            </Button>
          </div>
        </Drawer>
      </Section>

      {/* ─────────── LOADER / SPINNER ─────────── */}
      <Section title="Loader / Spinner">
        <div className="flex items-center gap-8">
          {(['sm', 'md', 'lg'] as const).map((sz) => (
            <div key={sz} className="flex flex-col items-center gap-2">
              <Loader size={sz} />
              <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                {sz}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────── SKELETON ─────────── */}
      <Section title="Skeleton">
        <div className="w-full max-w-lg space-y-3">
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="100%" height="0.75rem" />
          <Skeleton width="80%" height="0.75rem" />
          <div className="mt-4">
            <p className="label-xs mb-3" style={{ color: 'var(--color-text-subtle)' }}>
              Skeleton Card:
            </p>
            <SkeletonCard />
          </div>
        </div>
      </Section>

      {/* ─────────── TYPOGRAPHY ─────────── */}
      <Section title="Typography Scale">
        <div className="w-full space-y-3">
          <div
            className="text-5xl font-extrabold tracking-tighter"
            style={{ color: 'var(--color-primary)' }}
          >
            Display XL
          </div>
          <div
            className="text-4xl font-extrabold tracking-tighter"
            style={{ color: 'var(--color-primary)' }}
          >
            Heading 1
          </div>
          <div
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Heading 2
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Heading 3
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Body Text — Regular paragraph copy for content
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            Caption text — supporting content
          </div>
          <div className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Label XS — uppercase tracking-widest
          </div>
        </div>
      </Section>

      {/* ─────────── COLOR PALETTE ─────────── */}
      <Section title="Color System (CSS Variables)">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            '--color-primary',
            '--color-bg',
            '--color-surface-low',
            '--color-surface-mid',
            '--color-surface-high',
            '--color-border',
            '--color-text',
            '--color-text-muted',
            '--color-text-subtle',
            '--color-text-faint',
            '--color-success',
            '--color-error',
            '--color-warning',
            '--color-info',
          ].map((cssVar) => (
            <div key={cssVar} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex-shrink-0"
                style={{
                  backgroundColor: `var(${cssVar})`,
                  border: '1px solid var(--color-border)',
                }}
              />
              <p
                className="text-[10px] font-mono break-all"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {cssVar}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────── ICONS ─────────── */}
      <Section title="Icons (Material Symbols)">
        {[
          'dashboard',
          'group',
          'settings',
          'notifications',
          'search',
          'add',
          'edit',
          'delete',
          'arrow_forward',
          'upload_file',
          'analytics',
          'history',
          'person',
          'rocket_launch',
          'auto_awesome',
          'shield',
          'payments',
          'key',
          'lock',
          'check_circle',
        ].map((icon) => (
          <div key={icon} className="flex flex-col items-center gap-2">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {icon}
            </span>
            <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
              {icon}
            </p>
          </div>
        ))}
      </Section>
    </div>
  )
}
