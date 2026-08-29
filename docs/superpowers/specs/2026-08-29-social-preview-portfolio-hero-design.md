# Social Preview and Browser Icon Refresh

## Goal

Replace the current social preview and browser icon artwork with assets derived from `public/portfolio_hero.png`, while preserving the site's established dark, high-contrast identity.

## Open Graph Image

- Produce a `1200x630` social preview from a centered crop of `public/portfolio_hero.png`.
- Keep Radwa visually prominent while retaining usable dark space on the left.
- Add a subtle dark overlay and a stronger left-side black gradient so the copy remains readable.
- Reuse the existing English copy:
  - `RADWA MUHAMMED`
  - `Marketing strategy, services, templates and practical growth systems.`
  - `radwamuhammed.com`
  - `Strategy / Proof / Execution`
- Use the current yellow, white, and black brand treatment.
- Replace `public/og-radwa.jpg` so existing Open Graph and Twitter metadata continue to work without route changes.

## Browser and App Icons

- Create a centered square crop around Radwa's face from `public/portfolio_hero.png`.
- Do not add text because it will not remain legible at favicon sizes.
- Update the PNG icon sources, Apple touch icon, Next.js app icon, and favicon ICO from the same crop.

## Validation

- Confirm all generated files have the intended dimensions and formats.
- Run the production build to verify metadata and asset resolution.
- Inspect the final social image and square icon crop visually.
- Commit and push the completed asset refresh to `master`.
