// Exercise + skill catalogue. Pure data: edit here to add or retune skills.

export type Tier = 'F' | 'B' | 'I' | 'A' | 'E'
export const TIERS: Record<Tier, string> = { F: 'Foundation', B: 'Beginner', I: 'Intermediate', A: 'Advanced', E: 'Elite' }

export type Equipment = 'mat' | 'bricks' | 'belt' | 'handles' | 'dumbbell' | 'gripper' | 'bar'
export const EQUIPMENT: Record<Equipment, string> = {
  mat: 'Yoga mat', bricks: 'Yoga bricks', belt: 'Yoga belt', handles: 'Push-up handles',
  dumbbell: 'Dumbbell', gripper: 'Grip trainer', bar: 'Pull-up bar',
}

export interface Exercise {
  id: string
  name: string
  hold: boolean // true = timed hold in seconds, false = reps
  lo: number // bottom of target range
  hi: number // top of range; 3 sets at hi = mastered
  tier: Tier
  needs: Equipment[]
  cue: string
  perSide?: boolean
  track: string | null // null = accessory
  index: number // position in track
  load?: Load // weighted gym lift
}

/** Weighted lift settings (kg). Dumbbell weights are per hand. */
export interface Load {
  inc: number // weight step when the rep range is maxed
  start: number // typical starting weight for a beginner on this lift
  grad?: number // at this weight, move on to the next lift in the track
  barbell?: boolean // show plate calculator + warm-up sets
  bw?: number // start as a fraction of bodyweight for experienced lifters
  perHand?: boolean
}

type Row = [id: string, name: string, type: 'r' | 'h', lo: number, hi: number, tier: Tier, needs: Equipment[], cue: string, perSide?: boolean]

export interface Track { id: string; name: string; nodes: Exercise[] }

const RAW: { id: string; name: string; rows: Row[] }[] = [
  { id: 'push', name: 'Push', rows: [
    ['incline_pu', 'Incline push-up', 'r', 8, 15, 'F', [], 'Hands on bricks, body one straight line.'],
    ['knee_pu', 'Knee push-up', 'r', 8, 15, 'F', [], 'Hips in line with shoulders, chest to floor.'],
    ['pushup', 'Push-up', 'r', 5, 12, 'B', [], 'Elbows ~45°, ribs down, glutes tight, chest touches floor.'],
    ['deficit_pu', 'Deficit push-up', 'r', 6, 12, 'B', ['handles'], 'On push-up handles; sink chest below hand level.'],
    ['diamond_pu', 'Diamond push-up', 'r', 6, 12, 'I', [], 'Hands together under chest, elbows brush ribs.'],
    ['archer_pu', 'Archer push-up', 'r', 4, 8, 'I', [], 'Shift weight to one arm, other arm stays straight.', true],
    ['pseudo_pu', 'Pseudo planche push-up', 'r', 5, 10, 'A', [], 'Hands by hips, lean forward, protract shoulders.'],
    ['oa_pu', 'One-arm push-up', 'r', 1, 5, 'E', [], 'Wide stance, square hips, slow lowering.', true],
  ] },
  { id: 'pull', name: 'Pull', rows: [
    ['db_row', 'Dumbbell row', 'r', 8, 15, 'F', ['dumbbell'], 'Flat back, pull elbow to hip, pause at top.', true],
    ['table_row', 'Table row', 'r', 6, 12, 'B', [], 'Under a sturdy table. Test it first. Body straight.'],
    ['dead_hang', 'Dead hang', 'h', 20, 60, 'B', ['bar'], 'Full grip, shoulders active, no swinging.'],
    ['neg_pullup', 'Negative pull-up', 'r', 3, 6, 'I', ['bar'], 'Jump to the top, lower for 5 seconds.'],
    ['pullup', 'Pull-up', 'r', 3, 10, 'I', ['bar'], 'Dead hang start, chin over bar, no kipping.'],
    ['muscle_up', 'Muscle-up', 'r', 1, 5, 'A', ['bar'], 'Explosive high pull, fast transition over the bar.'],
    ['oa_pullup', 'One-arm pull-up', 'r', 1, 3, 'E', ['bar'], 'Years of work. Assisted versions first.', true],
  ] },
  { id: 'legs', name: 'Legs', rows: [
    ['bw_squat', 'Bodyweight squat', 'r', 15, 30, 'F', [], 'Heels down, knees track toes, hips below knees.'],
    ['split_squat', 'Split squat', 'r', 8, 12, 'F', [], 'Back knee to floor, front shin vertical.', true],
    ['goblet_squat', 'Goblet squat', 'r', 8, 15, 'B', ['dumbbell'], 'Dumbbell at chest, elbows inside knees at the bottom.'],
    ['bulgarian', 'Bulgarian split squat', 'r', 8, 12, 'I', [], 'Rear foot on a chair, torso slightly forward.', true],
    ['assist_pistol', 'Assisted pistol', 'r', 5, 10, 'I', [], 'Hold a door frame or yoga belt, one leg down.', true],
    ['pistol', 'Pistol squat', 'r', 3, 8, 'A', [], 'Free leg straight, full depth, controlled.', true],
  ] },
  { id: 'core', name: 'Core', rows: [
    ['dead_bug', 'Dead bug', 'r', 8, 12, 'F', [], 'Lower back glued to the floor.', true],
    ['plank', 'Plank', 'h', 30, 60, 'F', [], 'Squeeze glutes, push the floor away.'],
    ['hollow_hold', 'Hollow hold', 'h', 15, 40, 'F', [], 'Lower back flat, arms by ears, legs low.'],
    ['tuck_lsit', 'Tuck L-sit', 'h', 10, 20, 'B', [], 'On bricks or handles, shoulders pushed down.'],
    ['lsit', 'L-sit', 'h', 10, 20, 'I', [], 'Legs straight and level, toes pointed.'],
    ['vsit', 'V-sit', 'h', 3, 10, 'E', [], 'Hips behind hands, legs above horizontal.'],
  ] },
  { id: 'handstand', name: 'Handstand', rows: [
    ['pike_pu', 'Pike push-up', 'r', 5, 10, 'B', [], 'Hips high, head goes in front of hands.'],
    ['elev_pike', 'Elevated pike push-up', 'r', 5, 10, 'I', [], 'Feet on a chair, hands on bricks for depth.'],
    ['ctw_hs', 'Chest-to-wall handstand', 'h', 20, 60, 'I', [], 'Belly to wall, straight line, push tall.'],
    ['free_hs', 'Freestanding handstand', 'h', 10, 30, 'A', [], 'Balance with fingers, stack hips over shoulders.'],
    ['hspu', 'Handstand push-up', 'r', 3, 8, 'A', [], 'Wall-supported, head to a mat, tripod shape.'],
    ['press_hs', 'Press to handstand', 'r', 1, 5, 'E', [], 'Needs compression and planche-lean strength.'],
  ] },
  { id: 'planche', name: 'Planche', rows: [
    ['pl_lean', 'Planche lean', 'h', 10, 30, 'B', [], 'Arms straight, lean forward, shoulders past hands.'],
    ['crow', 'Crow pose (Bakasana)', 'h', 10, 30, 'B', [], 'Also practised on Saturday yoga. Knees high on arms.'],
    ['tuck_pl', 'Tuck planche', 'h', 5, 15, 'A', [], 'Hips level with shoulders, arms locked.'],
    ['adv_tuck_pl', 'Advanced tuck planche', 'h', 5, 15, 'A', [], 'Flat back, knees away from chest.'],
    ['straddle_pl', 'Straddle planche', 'h', 3, 10, 'E', [], 'Legs wide and straight, body horizontal.'],
    ['full_pl', 'Full planche', 'h', 3, 8, 'E', [], 'Body fully horizontal, legs together.'],
  ] },
]

const ACC: Row[] = [
  ['sl_bridge', 'Single-leg glute bridge', 'r', 8, 15, 'F', [], 'Drive through the heel, hips level.', true],
  ['gripper', 'Grip trainer squeezes', 'r', 10, 25, 'F', ['gripper'], 'Full close, slow open.', true],
]

function make([id, name, type, lo, hi, tier, needs, cue, perSide]: Row, track: string | null, index: number): Exercise {
  return { id, name, hold: type === 'h', lo, hi, tier, needs, cue, perSide, track, index }
}

export const TRACKS: Track[] = RAW.map(t => ({ id: t.id, name: t.name, nodes: t.rows.map((r, i) => make(r, t.id, i)) }))
export const ACCESSORIES: Exercise[] = ACC.map(r => make(r, null, 0))
export const EX: Record<string, Exercise> = Object.fromEntries(
  [...TRACKS.flatMap(t => t.nodes), ...ACCESSORIES].map(e => [e.id, e]),
)

// Weekly blueprint from the PDF. Index 0 = Sunday (JS getDay()).
export type DayKind = 'strength' | 'yoga' | 'rest'
export interface DayPlan { kind: DayKind; yoga: string; evening: string }
export const WEEK: DayPlan[] = [
  { kind: 'rest', yoga: 'Full physical rest, gentle walk', evening: 'Rest' },
  { kind: 'strength', yoga: 'Chest & upper-back decompression', evening: 'Rest or walk' },
  { kind: 'yoga', yoga: 'Hip mobility & Siddhasana prep', evening: 'Run 20–30 min + 2 min lunges' },
  { kind: 'strength', yoga: 'Spinal twists & side bends', evening: 'Rest or walk' },
  { kind: 'yoga', yoga: 'Backbends (spine extension)', evening: 'Run 20–30 min + 2 min lunges' },
  { kind: 'strength', yoga: 'Forward folds (hamstrings & back)', evening: 'Rest or walk' },
  { kind: 'yoga', yoga: 'Arm balances (Bakasana) & inversions', evening: 'Optional run' },
]

// One-tap check-offs. `on` limits an item to certain day kinds.
export const CHECKS: { key: string; short: string; title: string; sub: string; group: 'session' | 'rhythm'; on?: DayKind[] }[] = [
  { key: 'warm', short: 'Wrist prep', title: 'Wrist prep + brick scapular presses', sub: '3 min', group: 'session', on: ['strength'] },
  { key: 'sn_pre', short: 'Sun salutes', title: 'Surya Namaskar · 5 crisp rounds', sub: '~4 min, 1 breath per movement', group: 'session', on: ['strength'] },
  { key: 'sn_post', short: 'Slow salutes', title: 'Surya Namaskar · 5 slow rounds', sub: '~6 min, knees down on the lowering', group: 'session', on: ['strength'] },
  { key: 'ysec', short: 'Yoga holds', title: 'Yoga sector', sub: '2–3 deep holds + counterpose, 8–10 min', group: 'session', on: ['strength'] },
  { key: 'shav', short: 'Shavasana', title: 'Shavasana', sub: '5 min', group: 'session', on: ['strength', 'yoga'] },
  { key: 'yoga', short: 'Hatha yoga', title: 'Hatha yoga session', sub: '35 min', group: 'session', on: ['yoga'] },
  { key: 'morning', short: 'Morning', title: 'Morning sadhana', sub: 'Loosening 3m · Pranayama 10m · Dhyana 20–30m', group: 'rhythm' },
  { key: 'evening', short: 'Evening', title: 'Evening', sub: '', group: 'rhythm' },
  { key: 'night', short: 'Night', title: 'Night sadhana', sub: '3 min slow Nadi Shodhana · Dhyana 20–30m', group: 'rhythm' },
]

export const videoUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' calisthenics tutorial')}`

// ---------- gym mode ----------
type GymRow = [id: string, name: string, lo: number, hi: number, tier: Tier, load: Load, cue: string]
const GYM_RAW: { id: string; name: string; rows: GymRow[] }[] = [
  { id: 'g_squat', name: 'Squat', rows: [
    ['leg_press', 'Leg press', 10, 15, 'F', { inc: 5, start: 40, grad: 100 }, 'Feet shoulder-width, lower until knees reach ~90°, do not lock knees at the top.'],
    ['g_goblet', 'Goblet squat', 8, 12, 'B', { inc: 2, start: 10, grad: 24 }, 'Dumbbell at chest, sit between your knees, heels down.'],
    ['back_squat', 'Barbell back squat', 5, 8, 'I', { inc: 5, start: 30, barbell: true, bw: 0.8 }, 'Bar on upper back, brace, hips below knees, use the safety pins.'],
  ] },
  { id: 'g_hinge', name: 'Hinge', rows: [
    ['db_rdl', 'Dumbbell Romanian deadlift', 8, 12, 'F', { inc: 2, start: 10, grad: 24, perHand: true }, 'Soft knees, push hips back, dumbbells slide down the thighs, flat back.'],
    ['bb_rdl', 'Barbell Romanian deadlift', 8, 10, 'B', { inc: 5, start: 40, grad: 80, barbell: true }, 'Bar close to legs, hinge until a hamstring stretch, squeeze glutes up.'],
    ['deadlift', 'Deadlift', 3, 6, 'I', { inc: 5, start: 60, barbell: true, bw: 1 }, 'Bar over mid-foot, brace, push the floor away, bar stays touching the legs.'],
  ] },
  { id: 'g_press', name: 'Bench', rows: [
    ['db_bench', 'Dumbbell bench press', 8, 12, 'F', { inc: 2, start: 8, grad: 22, perHand: true }, 'Shoulder blades squeezed, lower to chest level, press up and slightly in.'],
    ['bench', 'Barbell bench press', 5, 8, 'I', { inc: 2.5, start: 30, barbell: true, bw: 0.6 }, 'Feet planted, bar to lower chest, elbows ~45°. Use safety arms or a spotter.'],
  ] },
  { id: 'g_ohp', name: 'Overhead', rows: [
    ['db_ohp', 'Seated dumbbell shoulder press', 8, 12, 'F', { inc: 2, start: 6, grad: 18, perHand: true }, 'Back against the bench, press up without arching, lower to ear level.'],
    ['ohp', 'Barbell overhead press', 5, 8, 'I', { inc: 2.5, start: 20, barbell: true, bw: 0.4 }, 'Glutes tight, press the bar in a straight line, head through at the top.'],
  ] },
  { id: 'g_row', name: 'Row', rows: [
    ['cable_row', 'Seated cable row', 10, 12, 'F', { inc: 5, start: 25, grad: 60 }, 'Chest up, pull the handle to your belly, squeeze shoulder blades.'],
    ['bb_row', 'Barbell row', 6, 10, 'I', { inc: 2.5, start: 30, barbell: true, bw: 0.5 }, 'Hinge to ~45°, pull the bar to your lower ribs, no jerking.'],
  ] },
  { id: 'g_pull', name: 'Pulldown', rows: [
    ['lat_pd', 'Lat pulldown', 8, 12, 'F', { inc: 5, start: 25, grad: 60 }, 'Pull the bar to the top of your chest, elbows down, control it back up.'],
    ['g_pullup', 'Pull-up', 3, 10, 'I', { inc: 0, start: 0 }, 'Full hang, chest to the bar, no swinging.'],
  ] },
]
const GYM_ACC_RAW: GymRow[] = [
  ['g_curl', 'Dumbbell curl', 10, 15, 'F', { inc: 1, start: 5, perHand: true }, 'Elbows by your sides, no swinging.'],
  ['g_calf', 'Standing calf raise', 12, 20, 'F', { inc: 5, start: 20 }, 'Full stretch at the bottom, pause at the top.'],
]
const makeGym = ([id, name, lo, hi, tier, load, cue]: GymRow, track: string | null, index: number): Exercise =>
  ({ id, name, hold: false, lo, hi, tier, needs: [], cue, track, index, load: load.inc || load.start ? load : undefined })

export const GYM_TRACKS: Track[] = GYM_RAW.map(t => ({ id: t.id, name: t.name, nodes: t.rows.map((r, i) => makeGym(r, t.id, i)) }))
export const GYM_ACCESSORIES: Exercise[] = GYM_ACC_RAW.map(r => makeGym(r, null, 0))
export const ALL_TRACKS: Track[] = [...TRACKS, ...GYM_TRACKS]
for (const e of [...GYM_TRACKS.flatMap(t => t.nodes), ...GYM_ACCESSORIES]) EX[e.id] = e
export const trackById = (id: string | null) => ALL_TRACKS.find(t => t.id === id)

export type Style = 'cali' | 'gym' | 'mixed'
export const STYLES: Record<Style, { name: string; icon: string; short: string }> = {
  cali: { name: 'Calisthenics', icon: 'push', short: 'Bodyweight skills, minimal equipment' },
  gym: { name: 'Gym', icon: 'dumbbell', short: 'Machines, dumbbells and barbells' },
  mixed: { name: 'Mixed', icon: 'target', short: 'Calisthenics upper body + gym legs and back' },
}
