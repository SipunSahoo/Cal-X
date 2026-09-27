# Cal-X — Task Plan

Personal calisthenics training and progression app. Takes me from beginner to advanced skills with a proper progression system, tracking, and recovery awareness. Built around my weekly blueprint (`complete_weekly_yoga_calisthenics_master_blueprint.pdf`).

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Decisions (locked 2026-09-27)

| Area | Decision |
|---|---|
| Users | Just me. No accounts, no social features. |
| Platform | PWA (installable web app). Installed on iPhone via Safari → Share → Add to Home Screen. Android later, same code. No Mac, no App Store, no 7-day expiry. |
| Stack | React + TypeScript + Vite 6, `vite-plugin-pwa` (offline), `localStorage` for data (small, simple; backup via export). Code in `app/`. Rollup/esbuild use their WebAssembly builds because Windows Application Control blocks native build binaries. |
| Scope v1 | Calisthenics in depth. Yoga, runs, pranayama and meditation are one-tap daily check-offs. |
| Schedule | Calisthenics Mon / Wed / Fri · Hatha yoga Tue / Thu / Sat · Rest Sun (from the PDF). |
| Equipment | Yoga mat, push-up handles, yoga belt, yoga bricks, dumbbell, grip trainer. **No pull-up bar yet.** |
| Pulling | Bar-free pulling first (dumbbell rows, table rows). Bar skills unlock when I toggle "Pull-up bar" on in settings. |
| Start level | 1–10 push-ups, 30–60 s plank → Foundation / Beginner. |
| Form guidance | Text cues + a demo video link per exercise. |
| Backup | Manual JSON export / import. No backend. |
| Gamification | Skill unlocks, personal records, streaks, milestones. No XP. |

## Future plan

- **Yoga as a first-class module** (after calisthenics v1 is stable): yoga sessions per PDF theme (hip mobility, backbends, arm balances & inversions), pose library with holds, mobility progressions, and yoga-side skills that feed the calisthenics tree (e.g. Bakasana → crow → planche line; backbends → bridge).
- Meditation timer (morning / night Dhyana, pranayama).
- Run logging (duration, nasal breathing yes/no).
- AI weekly coach (Claude API; optional, needs internet and an API key).
- Android install (same PWA).
- Later, if needed: wrap with Capacitor for a native build (Apple Health, better haptics).

**Design rule for the future:** the data model is activity-generic (`Activity` → `Session` → `Block` → `Entry`) so yoga, runs and meditation slot in without a rewrite.

---

## Phase 0 — Prototype  ✅ current
- [x] Interactive click-through prototype (`prototype/index.html`) covering: onboarding, Today, recovery check-in, workout player (reps, holds, rest timer, RPE, pain flag), session summary with coaching decisions, skill tree, progress, settings
- [ ] Review prototype on iPhone and collect feedback
- [ ] Lock UX changes from feedback

## Phase 1 — Product architecture  ✅ done
- [x] Analyse brief + PDF blueprint
- [x] Identify contradictions (native vs free install, calisthenics-only vs full routine, no pull-up bar)
- [x] Feature questions answered

## Phase 2 — UX architecture
- [x] Navigation: 4 tabs — Today · Skills · Progress · You; full-screen workout player
- [x] Screen inventory + user flows (onboarding → assessment → placement → first session → summary → unlock)
- [x] Progression system spec (tracks, nodes, tiers, cross-requirements, equipment gates)
- [x] Adaptive rules spec (see *Progression rules* below)
- [x] Data model (see below)

## Phase 3 — UI design system
- [x] Tokens: colour (dark-first + light), type (Barlow Condensed display / IBM Plex Sans body), spacing, radius
- [x] Components: buttons, cards, chips, steppers, rings, timers, sheets, tab bar, skill node, heatmap cell, chart
- [ ] Motion rules (set complete, unlock, rest timer) + reduced-motion fallbacks

## Phase 4 — Core implementation
- [x] Project scaffold (Vite + React + TS + PWA plugin + Dexie)
- [x] Exercise & skill catalogue as data (JSON), not code
- [x] Onboarding + assessment + placement
- [x] Today screen (weekly plan from blueprint, check-offs, session preview)
- [x] Workout player (sets, reps, holds, RPE, notes, skip, swap, rest timer, wake lock)
- [x] Session summary + save
- [x] Skill tree (tracks, node states, requirements, node detail)
- [x] Progress (PRs, charts, heatmap, consistency, milestones)
- [x] You / settings (equipment, schedule, rules, backup export/import)
- [ ] Host it (HTTPS) and install on iPhone; test offline

## Phase 5 — Intelligence
- [x] Progression engine (double progression per exercise, variation advance, deload)
- [x] Skill unlocking with cross-track requirements and equipment gates
- [x] PR detection
- [x] Recovery-aware sessions (readiness score → lighter session)
- [x] Pain flag → stop progression for that exercise + "see a professional" guidance
- [x] Breathing module: custom 4-phase patterns (inhale · hold · exhale · hold), sequences mixing patterns + pauses, animated fill circle, sound + haptic cue on every phase change, auto-ticks morning/night sadhana
- [x] Push reminders: editable times/days per task (defaults from the blueprint), Cloudflare Worker cron sends Web Push (worker/), deployed by the Pages workflow
- [x] Weekly plan screen (Today → "Week N plan"): week, morning/evening flow, strength-day blocks, progression rules
- [x] Body tracking: height, goal (lose / gain / maintain / recomp), optional target, weigh-ins + waist, trend chart, weekly pace vs healthy range, BMI; onboarding step, Today prompt, Sunday weigh-in reminder
- [x] Automatic encrypted cloud backup (after changes + when the app is closed), personal backup code, restore on You tab or first setup screen
- [ ] Meditation timer (Dhyana), run logging
- [ ] AI weekly coach (optional)

## Phase 6 — Polish
- [x] Redesign v2 "training logbook": Archivo (expanded for numbers/headings), graphite + bone + turmeric accent, breath blue, square shapes, ruled rows instead of card stacks
- [x] Performance: self-hosted fonts (no Google request, offline), screens code-split and lazy-loaded, breathing animation updates the DOM directly (no per-frame React renders)
- [ ] Empty / loading / error states
- [ ] Accessibility (contrast, tap targets ≥ 44 px, VoiceOver labels)
- [ ] Performance, offline edge cases, storage-eviction warning + backup reminder
- [ ] UX consistency pass

## Phase 8 — Gym mode (planned, not started)
Goal: people who train in a gym get the same coaching loop (plan → log → auto-progress → unlocks → progress), with weights instead of bodyweight skills. Breathing, yoga check-offs, body tracking, reminders and backup stay shared.

- [ ] **G1 · Setup:** onboarding asks training style (Calisthenics / Gym / Mixed) and gym access; a 1-minute strength check (e.g. "a weight you can lift 10 times") sets starting loads
- [ ] **G2 · Lift catalogue:** 6 movement tracks, each from machine/dumbbell to barbell: Squat (leg press → goblet → back squat), Hinge (RDL → deadlift), Horizontal push (DB press → bench), Vertical push (DB press → OHP), Horizontal pull (cable/DB row → barbell row), Vertical pull (lat pulldown → assisted → pull-up); plus arms, calves, core
- [ ] **G3 · Programs:** beginner full body 3×/week (fits Mon/Wed/Fri), then upper/lower 4×/week, later push/pull/legs; exercise swap for busy machines
- [ ] **G4 · Weight progression rules:** double progression with load (reach top of rep range on all sets → +2.5 kg upper / +5 kg lower); 2 missed sessions → deload 10%; same effort (RPE) and readiness rules as now
- [ ] **G5 · Workout player:** weight field per set (prefilled), auto warm-up sets (empty bar ×10, 50% ×5, 70% ×3), plate calculator, longer rest for big lifts (2–3 min)
- [ ] **G6 · Strength levels instead of skill unlocks:** standards relative to bodyweight (e.g. bench 0.5× → 0.75× → 1× → 1.25× → 1.5× BW) using the weight already tracked in Body; estimated 1-rep-max charts
- [ ] **G7 · Manual:** gym basics (bracing, safe bar path, choosing a starting weight, using safety pins / a spotter, gym etiquette) + a how-to for each lift
- [ ] **Mixed mode:** calisthenics skills for upper body + gym lifts for legs and back

## Phase 7 — Yoga module (future)
- [ ] Yoga session templates per blueprint day
- [ ] Pose library + hold tracking
- [ ] Mobility progressions and links into the calisthenics tree

---

## Progression rules (v1, configurable)

| Rule | Default | Meaning |
|---|---|---|
| Rep / hold range | per exercise, e.g. push-up 5–12 | Double progression: raise the target inside the range, then advance the variation. |
| Progress | all sets ≥ target and max RPE ≤ 8 | Target +1 rep (or +5 s). +2 if every set beat the target by 2+. |
| Advance | all sets ≥ top of range, RPE ≤ 8 | Variation mastered → next node in the track at the bottom of its range. |
| Hold | hit target but RPE > 8, or total ≥ 75 % | Repeat the same target. |
| Ease off | total < 75 % of target volume | Target −1 rep (−5 s); at the range floor, suggest the easier variation. |
| Readiness | score < 50 | Lighter session: −1 set per exercise. |
| Pain | flagged | No progression; stop exercise; advise professional help if sharp or lasting. |

## Data model (draft)

- `Profile` — name, startDate, equipment[], schedule, rules
- `Track` — push, pull, legs, core, handstand, planche, lever (yoga tracks later)
- `SkillNode` — id, trackId, name, tier, type (reps | hold), range, perSide, equipment[], crossRequirements[], cues[], videoUrl
- `Prescription` — nodeId, sets, target (current working target)
- `Mastery` — nodeId, masteredAt
- `DayPlan` — weekday → activities (strength / yoga / run / meditation / rest)
- `Session` — id, date, activity, startedAt, endedAt, readinessId, notes
- `SetEntry` — sessionId, nodeId, setIndex, value, rpe, skipped, pain
- `CheckOff` — date, key (morning, warm-up, cool-down, yoga, run, night)
- `RunLog` — date, minutes, nasalBreathing, feel
- `Readiness` — date, sleep, energy, soreness, pain, score
- `PersonalRecord` — nodeId, value, date (derived)
- `Milestone` — id, rule, achievedAt (derived)
