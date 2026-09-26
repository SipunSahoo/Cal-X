// Reminder times. Days use JS getDay(): 0 = Sunday.
export interface Reminder { id: string; title: string; body: string; icon: string; time: string; days: number[]; on: boolean }

const ALL = [0, 1, 2, 3, 4, 5, 6]

// Defaults follow the weekly blueprint: sadhana every morning and night, strength Mon/Wed/Fri, yoga Tue/Thu/Sat, runs Tue/Thu.
export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'morning', title: 'Morning sadhana', body: 'Loosening, pranayama, then dhyana. Empty stomach.', icon: 'sunrise', time: '05:30', days: ALL, on: true },
  { id: 'strength', title: 'Strength session', body: 'Your full-body circuit is ready. Warm up first.', icon: 'dumbbell', time: '06:30', days: [1, 3, 5], on: true },
  { id: 'yoga', title: 'Hatha yoga', body: "Today's yoga sector is waiting.", icon: 'lotus', time: '06:30', days: [2, 4, 6], on: true },
  { id: 'run', title: 'Evening run', body: '20–30 min easy, nasal breathing. Hip reset after.', icon: 'run', time: '18:00', days: [2, 4], on: true },
  { id: 'night', title: 'Night sadhana', body: '3 min slow Nadi Shodhana, then dhyana.', icon: 'moon', time: '21:30', days: ALL, on: true },
]

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
