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
