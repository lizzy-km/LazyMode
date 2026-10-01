# LazyMode

Figma Dev Mode codegen plugin. For the selected node it emits (1) external CSS, one rule per node
(`._<sanitized id>`), and (2) a React/TSX component with inline styles using a `CalResponsiveValue(px)`
helper (scales to window width against a 1512px base design).

## Layout
- `code.ts` — all plugin logic (`figma.codegen.on('generate', ...)`). Edit this.
- `code.js` — compiled output, committed; `manifest.json` loads it. Rebuild and commit after editing `code.ts`.
- `function.ts`, `types.ts` — empty placeholders.
- `ui.html` — leftover template demo, unrelated to the plugin.

## Commands
- `npm install`, `npm run build` (tsc), `npm run watch`, `npm run lint` / `lint:fix`.
- No tests. To try it: Figma desktop > Plugins > Development > Import plugin from manifest, then Dev Mode > Inspect > language dropdown.

## Notes
- Node names containing `input` become `<input>`; containing `button` get `cursor: pointer`.
- Lint: unused vars are errors unless prefixed `_`.
