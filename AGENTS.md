<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Always-on repository rules

- `.agents/rules/structure.md` — **Structure Before Code / no god modules (HARD GATE)**:
  state the file/module layout before implementing; one file = one responsibility;
  ~500-line ceiling per file; never bolt a feature onto an oversized file — split first.
- Enforcement: run `git config core.hooksPath .githooks` once per clone — the pre-commit
  hook blocks any commit that grows a source file past 500 lines. Split instead of bypassing.
