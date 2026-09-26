# Cal-X app

Personal calisthenics training PWA. See `../TASKS.md` for the plan.

```sh
npm install
npm run dev              # local dev server
npm run build            # production build into dist/
npm run preview -- --host  # serve dist/ on the local network (test on phone)
node scripts/make-icons.mjs  # regenerate app icons
```

- `src/data/catalog.ts` — exercises, skill tracks, weekly plan (edit to add skills)
- `src/engine/progression.ts` — progression rules, placement, stats (no UI)
- `src/store.ts` — state + localStorage persistence + backup
- `src/screens/` — one file per screen

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Note: `package.json` overrides Rollup and esbuild with their WebAssembly builds because Windows Application Control blocks the native binaries on this PC.
