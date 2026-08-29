# Social Preview Portfolio Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current social preview and browser icons with branded assets derived from `public/portfolio_hero.png`.

**Architecture:** Add one deterministic Sharp-based asset generator that crops the existing source photo, composites the approved Open Graph typography, and emits all favicon variants from a shared face crop. Keep the existing metadata URLs stable so deployed pages pick up the replacement assets without routing changes.

**Tech Stack:** Node.js, Sharp, SVG text overlays, Next.js metadata files

## Global Constraints

- The Open Graph image must be `1200x630` and use `public/portfolio_hero.png`.
- The browser icon must be a centered square crop around Radwa's face with no text.
- Preserve the current yellow, white, and black brand treatment.
- Do not add dependencies.

---

### Task 1: Add the deterministic social asset generator

**Files:**
- Create: `scripts/generate-social-assets.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `public/portfolio_hero.png`
- Produces: `public/og-radwa.jpg`, `public/radwa-icon.png`, `public/apple-icon.png`, `src/app/icon.png`, `src/app/apple-icon.png`, and `src/app/favicon.ico`

- [x] **Step 1: Add a Node script using Sharp**

The script must resize the source to `1200x630` with `fit: 'cover'`, composite a dark SVG overlay containing the approved copy, extract one face-centered square crop, and write the PNG and ICO variants. The ICO output must wrap a 256px PNG payload in a valid ICO header.

- [x] **Step 2: Add the asset command**

Add `"assets:social": "node scripts/generate-social-assets.mjs"` to `package.json` scripts.

- [x] **Step 3: Generate the assets**

Run: `npm run assets:social`

Expected: all six output assets are written without errors.

### Task 2: Validate and ship the new artwork

**Files:**
- Verify: `public/og-radwa.jpg`
- Verify: `public/radwa-icon.png`
- Verify: `src/app/favicon.ico`

**Interfaces:**
- Consumes: generated image files and existing metadata configuration in `src/app/layout.tsx`
- Produces: verified deployable social and browser artwork

- [x] **Step 1: Verify dimensions and formats**

Run a Sharp metadata check. Expected: OG is JPEG `1200x630`; main icon is PNG `512x512`; Apple icons are PNG `180x180`; favicon starts with the ICO header and includes the generated `256x256` PNG.

- [x] **Step 2: Inspect the OG and icon visually**

Expected: Radwa remains recognizable, the text is unobstructed and readable, and the icon crop is centered on the face.

- [x] **Step 3: Run repository validation**

Run: `npm run build`

Expected: production build succeeds with no new errors.

- [x] **Step 4: Commit and push**

Run:

```bash
git add package.json scripts/generate-social-assets.mjs public/og-radwa.jpg public/radwa-icon.png public/apple-icon.png src/app/icon.png src/app/apple-icon.png src/app/favicon.ico docs/superpowers/plans/2026-08-29-social-preview-portfolio-hero.md
git commit -m "refresh social preview artwork"
git push origin master
```

Expected: `master` is pushed successfully and the worktree is clean.
