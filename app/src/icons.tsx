// Hand-drawn 24×24 line icons. <Icon name="push" />
import type { ReactNode } from 'react'

const P: Record<string, ReactNode> = {
  // training tracks
  push: <><path d="M3 19h18M5 15.5 16 12M15 12.3V19" /><circle cx="18.5" cy="11" r="1.8" /></>,
  pull: <><path d="M3 4h18M9 4l1.5 5M15 4l-1.5 5M12 12.5v5M12 17.5l-2 3.5M12 17.5l2 3.5" /><circle cx="12" cy="10" r="1.9" /></>,
  legs: <><circle cx="9" cy="4.5" r="1.8" /><path d="M9.5 7 11 12.5h6v7M10 9h7M4 20h16" /></>,
  core: <><path d="M3 11c4 5.5 13 5.5 18 0" /><circle cx="4.5" cy="8" r="1.8" /><path d="M20 11l1.5-3" /></>,
  handstand: <><path d="M12 3v10M12 3 10 2M12 3l2-1M12 11l-3 8M12 11l3 8M6 21h12" /><circle cx="12" cy="15.5" r="1.8" /></>,
  planche: <><path d="M4 10.5h12.5M13.5 10.5V19M4 21h16" /><circle cx="18.8" cy="10.5" r="1.8" /></>,
  bridge: <path d="M3 19h4l5-7 5 7h4M12 12V9" />,
  gripper: <path d="M8 3v9a4 4 0 0 0 8 0V3M12 16v5" />,
  // daily rhythm + yoga
  sunrise: <path d="M6 16a6 6 0 0 1 12 0M3 16h18M12 5v2.5M5.2 8.8l1.6 1.6M18.8 8.8l-1.6 1.6M8 20h8" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  run: <><circle cx="15" cy="4.5" r="1.8" /><path d="M13.5 8 10.5 13l3 2.5V21M10.5 13 6.5 15M13.5 8l3.5 3 3-1M10 17l-3 4" /></>,
  wrist: <path d="M8 21v-5l-2.5-4.5a1.5 1.5 0 0 1 2.6-1.5L9.5 12V5a1.5 1.5 0 0 1 3 0v6V4a1.5 1.5 0 0 1 3 0v7V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7z" />,
  lotus: <path d="M12 20c-4.5 0-8.5-2.5-9-6.5 3.5 0 6.5 1.5 9 4.5 2.5-3 5.5-4.5 9-4.5-.5 4-4.5 6.5-9 6.5zM12 18c-2.5-3.5-2.5-8 0-12 2.5 4 2.5 8.5 0 12z" />,
  rest: <><path d="M3 18h18M4 15h11" /><circle cx="18" cy="14" r="1.8" /></>,
  // breathing patterns
  box: <><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><path d="M4.5 9.5l-2 2 2 2" /></>,
  alternate: <path d="M8 20V4M16 4v16M5 7l3-3 3 3M13 17l3 3 3-3" />,
  wave: <path d="M2 12c2.5-5.5 5-5.5 7.5 0s5 5.5 7.5 0c1.2-2.7 3-3.3 5-2.5" />,
  hum: <path d="M3 12h2.5l2-4.5 3 9 3-11 3 9 1.5-2.5H21" />,
  breath: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 13.5c2.8-1.5 5.7-1.5 8.5 0s5.7 1.5 8.5 0" /></>,
  pause: <path d="M9 6v12M15 6v12" />,
  // ui
  bell: <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.2" /></>,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 7.5l3 3" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: <><rect x="6" y="11" width="12" height="9" rx="2" /><path d="M9 11V8a3 3 0 0 1 6 0v3" /></>,
  flame: <path d="M12 21c-3.5 0-6-2.5-6-6 0-4 4-6 4-10 3 2 5 5 5 8 1-.8 1.5-2 1.5-3 1.5 1.5 1.5 3.5 1.5 5 0 3.5-2.5 6-6 6z" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 21h7M10 17h4v4h-4z" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 10v4M20.5 10v4M6.5 12h11" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  sound: <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />,
  vibrate: <><rect x="8" y="4" width="8" height="16" rx="2" /><path d="M4.5 8v8M19.5 8v8M2 10v4M22 10v4" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></>,
  bar: <path d="M3 5h18M6.5 5v15M17.5 5v15" />,
  bricks: <><rect x="4" y="13" width="16" height="6" rx="1" /><rect x="7" y="6" width="10" height="7" rx="1" /></>,
  mat: <><rect x="3" y="9" width="15" height="7" rx="1.5" /><circle cx="19" cy="12.5" r="2.5" /></>,
  belt: <path d="M3 12c3-4.5 15-4.5 18 0M3 12c3 4.5 15 4.5 18 0M9 9.5v5" />,
  handles: <path d="M4 17h16M7 17v-6h10v6M6 11h12" />,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" />,
  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14" />,
  contrast: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" /></>,
  restart: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4h4" />,
  trash: <path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  skip: <path d="M6 5.5v13l8.5-6.5zM18 5.5v13" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" />,
  today: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><rect x="7" y="13" width="3.5" height="3.5" rx=".5" /></>,
  skills: <><circle cx="12" cy="5" r="2.3" /><circle cx="6" cy="19" r="2.3" /><circle cx="18" cy="19" r="2.3" /><path d="M12 7.3v4.2l-6 5.2M12 11.5l6 5.2" /></>,
  progress: <path d="M4 20V13M10 20V7M16 20v-9M21.5 20h-19M15 4.5l3-1.5 2 3" />,
  you: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
}

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? P.target}
    </svg>
  )
}

export const TRACK_ICON: Record<string, string> = { push: 'push', pull: 'pull', legs: 'legs', core: 'core', handstand: 'handstand', planche: 'planche' }
export const exIcon = (ex: { id: string; track: string | null }) => ex.track ? TRACK_ICON[ex.track] : ex.id === 'gripper' ? 'gripper' : 'bridge'
export const CHECK_ICON: Record<string, string> = { warm: 'wrist', sn_pre: 'sun', sn_post: 'sun', ysec: 'lotus', shav: 'rest', yoga: 'lotus', morning: 'sunrise', evening: 'run', night: 'moon' }
export const PATTERN_ICON: Record<string, string> = { box: 'box', nadi: 'alternate', coherent: 'wave', '478': 'moon', bhramari: 'hum' }
export const EQUIP_ICON: Record<string, string> = { mat: 'mat', bricks: 'bricks', belt: 'belt', handles: 'handles', dumbbell: 'dumbbell', gripper: 'gripper', bar: 'bar' }
