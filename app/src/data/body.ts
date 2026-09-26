// Body tracking: height, goal, weigh-ins. Metric units. Guidance is general fitness advice, not medical.
export type Goal = 'lose' | 'gain' | 'maintain' | 'recomp'
export interface WeighIn { date: string; kg: number; waist?: number }
export interface Body { height?: number; goal?: Goal; target?: number; weights: WeighIn[] }

export const DEFAULT_BODY: Body = { weights: [] }

export const GOALS: Record<Goal, { name: string; icon: string; short: string; rate: [number, number]; tip: string }> = {
  lose: { name: 'Lose fat', icon: 'down', short: 'Slim down, keep muscle', rate: [-0.75, -0.25],
    tip: 'Aim to lose 0.25–0.75 kg a week. Keep training hard so you keep your muscle, walk on rest days, and eat protein at every meal.' },
  gain: { name: 'Gain muscle', icon: 'up', short: 'Build size and strength', rate: [0.1, 0.3],
    tip: 'Aim to gain 0.1–0.3 kg a week so most of it is muscle. Eat a small surplus and keep progressing your sets.' },
  maintain: { name: 'Maintain', icon: 'target', short: 'Stay where you are', rate: [-0.2, 0.2],
    tip: 'Stay within about 1 kg of your current weight. Training and skills are the focus.' },
  recomp: { name: 'Recomposition', icon: 'contrast', short: 'Same weight, more muscle', rate: [-0.2, 0.2],
    tip: 'Your weight may stay flat while your waist shrinks and strength rises. Log your waist too.' },
}

export const bmi = (kg: number, cm: number) => kg / (cm / 100) ** 2
export const bmiLabel = (v: number) => v < 18.5 ? 'Under' : v < 25 ? 'Healthy' : v < 30 ? 'Over' : 'High'

const DAY = 864e5
const t = (d: string) => new Date(d + 'T12:00').getTime()

/** kg per week over the last 4 weeks (least-squares slope). Needs 2+ weigh-ins at least 5 days apart. */
export function weeklyRate(weights: WeighIn[]): number | null {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  if (!sorted.length) return null
  const cutoff = t(sorted[sorted.length - 1].date) - 28 * DAY
  const pts = sorted.filter(w => t(w.date) >= cutoff)
  if (pts.length < 2 || t(pts[pts.length - 1].date) - t(pts[0].date) < 5 * DAY) return null
  const xs = pts.map(p => t(p.date) / (7 * DAY)), ys = pts.map(p => p.kg)
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length
  const num = xs.reduce((a, x, k) => a + (x - mx) * (ys[k] - my), 0), den = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  return den ? num / den : null
}

export function paceVerdict(goal: Goal, rate: number): { label: string; tone: 'good' | 'warn' } {
  const [lo, hi] = GOALS[goal].rate
  if (rate < lo) return { label: goal === 'lose' ? 'Faster than advised' : goal === 'gain' ? 'Losing weight' : 'Dropping', tone: 'warn' }
  if (rate > hi) return { label: goal === 'gain' ? 'Faster than advised' : goal === 'lose' ? 'Gaining weight' : 'Rising', tone: 'warn' }
  return { label: 'On track', tone: 'good' }
}
