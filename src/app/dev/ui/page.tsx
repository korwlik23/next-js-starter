import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'UI Components' }

export default function DevUIPage() {
  return (
    <div>
      <header className="mb-12">
        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-neutral-500 font-bold mb-2">
          Developer
        </p>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white">
          UI Component Library
        </h1>
        <p className="text-neutral-500 text-sm mt-2">All available components for this project</p>
      </header>

      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button className="bg-white text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors">
            Primary
          </button>
          <button className="bg-neutral-900 text-white border border-neutral-700 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors">
            Secondary
          </button>
          <button className="bg-transparent text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-900 transition-colors">
            Ghost
          </button>
          <button className="border border-neutral-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors">
            Outline
          </button>
          <button className="bg-red-600 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-red-500 transition-colors">
            Danger
          </button>
          <button
            disabled
            className="bg-white text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest opacity-30 cursor-not-allowed"
          >
            Disabled
          </button>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Default', cls: 'bg-neutral-800 text-neutral-300' },
            { label: 'Success', cls: 'bg-green-900/50 text-green-400' },
            { label: 'Warning', cls: 'bg-yellow-900/50 text-yellow-400' },
            { label: 'Error', cls: 'bg-red-900/50 text-red-400' },
            { label: 'Info', cls: 'bg-blue-900/50 text-blue-400' },
          ].map(({ label, cls }) => (
            <span
              key={label}
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Inputs */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Inputs
        </h2>
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
              Default Input
            </label>
            <input className="editorial-input w-full" placeholder="Type something..." />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
              With Error
            </label>
            <input
              className="editorial-input w-full border-b-red-500"
              placeholder="Invalid input"
            />
            <p className="mt-1 text-xs text-red-400">This field is required</p>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
              Disabled
            </label>
            <input className="editorial-input w-full opacity-30" placeholder="Disabled" disabled />
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Typography
        </h2>
        <div className="space-y-4">
          <div className="text-6xl font-extrabold tracking-tighter text-white">Display XL</div>
          <div className="text-4xl font-extrabold tracking-tighter text-white">Heading 1</div>
          <div className="text-2xl font-bold tracking-tight text-white">Heading 2</div>
          <div className="text-xl font-bold text-white">Heading 3</div>
          <div className="text-sm text-neutral-300">Body Text — Regular paragraph copy</div>
          <div className="text-xs text-neutral-500">Caption text — supporting content</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
            Label — XS
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Color Palette
        </h2>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {[
            '#050505',
            '#0a0a0a',
            '#111111',
            '#141414',
            '#1a1a1a',
            '#212121',
            '#2b2b2b',
            '#333333',
            '#474747',
            '#919191',
          ].map((color) => (
            <div key={color} className="text-center">
              <div
                className="w-full aspect-square border border-neutral-800"
                style={{ backgroundColor: color }}
              />
              <p className="text-[8px] text-neutral-600 mt-1 font-mono">{color}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Icons */}
      <section className="mb-12">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6 pb-4 border-b border-neutral-800">
          Icons (Material Symbols)
        </h2>
        <div className="flex flex-wrap gap-6">
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
          ].map((icon) => (
            <div key={icon} className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-neutral-300">{icon}</span>
              <p className="text-[9px] text-neutral-600">{icon}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
