// Plain-language exercise manual. General fitness guidance, not medical advice.

export interface Guide { why: string; steps: string[]; avoid: string[]; breathe: string }

export const BASICS: { icon: string; title: string; text: string }[] = [
  { icon: 'target', title: 'Sets and reps', text: 'A rep is one movement (one push-up). A set is a group of reps done without stopping. "3 × 8" means 3 sets of 8 reps, with a rest between sets.' },
  { icon: 'bolt', title: 'Effort 1–10', text: 'After each set, rate how hard it was. 7 = could do 3 more reps. 8 = 2 more. 9 = 1 more. 10 = nothing left. Most sets should end around 7–8. Clean reps build strength; grinding to failure mostly builds fatigue.' },
  { icon: 'pause', title: 'Rest between sets', text: 'Rest 60–90 seconds on main exercises so your muscles recover enough to do good reps again. The app times it for you.' },
  { icon: 'sun', title: 'Always warm up', text: 'Wrist circles, shoulder rolls and a few sun salutes raise your body temperature and prepare your joints. Cold joints get injured more easily.' },
  { icon: 'check', title: 'Form before numbers', text: 'Five perfect reps beat ten sloppy ones. If form breaks down, stop the set. The app will adjust your target instead of you forcing it.' },
  { icon: 'info', title: 'Soreness vs pain', text: 'A dull ache in the muscles a day or two later is normal. Sharp, stabbing or joint pain is not: stop that exercise and tap "Something hurts". If it lasts, see a physio or doctor.' },
  { icon: 'breath', title: 'Breathe while you train', text: 'Never hold your breath through a whole set. Breathe out on the hard part (pushing up, standing up), breathe in on the easy part (lowering).' },
  { icon: 'moon', title: 'Recovery makes you stronger', text: 'Muscles grow while you rest, not while you train. Aim for 7–8 hours of sleep, drink water through the day, and eat protein at each meal (dal, paneer, eggs, curd, soya, chicken).' },
  { icon: 'flame', title: 'Consistency wins', text: 'Three average sessions every week for a year will change your body. One heroic session followed by a week off will not. Showing up is the skill.' },
  { icon: 'progress', title: 'Why it helps your health', text: 'Strength training keeps muscles and bones strong, helps control blood sugar and blood pressure, improves posture and sleep, lowers stress and makes everyday life easier as you age.' },
]

const G: Record<string, Guide> = {
  // push
  incline_pu: { why: 'Builds chest, shoulders and arms at a lighter load. The safest way to learn the push-up.',
    steps: ['Put your hands on a bench, bed edge or stacked bricks, a little wider than your shoulders.', 'Walk your feet back until your body is one straight line from head to heels.', 'Bend your elbows and lower your chest to the edge.', 'Push back up until your arms are straight.'],
    avoid: ['Hips sagging or sticking up', 'Elbows flaring straight out to the sides'], breathe: 'In as you lower, out as you push up.' },
  knee_pu: { why: 'Strengthens chest, shoulders, arms and core. A stepping stone to full push-ups.',
    steps: ['Kneel and place your hands under your shoulders.', 'Walk your knees back so hips, back and head form a straight line.', 'Lower your chest to the floor with elbows at about 45°.', 'Push back up to straight arms.'],
    avoid: ['Bending at the hips', 'Stopping halfway down'], breathe: 'In on the way down, out on the way up.' },
  pushup: { why: 'Works chest, shoulders, arms and core together, and builds the base for every pushing skill.',
    steps: ['Hands under shoulders, fingers spread, legs straight behind you.', 'Squeeze your glutes and brace your belly like a plank.', 'Lower as one unit until your chest touches the floor, elbows at about 45°.', 'Push the floor away until your arms are straight.'],
    avoid: ['Hips dropping', 'Head poking forward', 'Half reps'], breathe: 'In while lowering, out while pushing.' },
  deficit_pu: { why: 'A deeper push-up. The extra range builds more chest and shoulder strength.',
    steps: ['Hold the push-up handles or place hands on bricks.', 'Set up a straight-body push-up position.', 'Lower slowly until your chest goes below your hands.', 'Push back up.'],
    avoid: ['Going deeper than is comfortable for your shoulders', 'Rushing the bottom'], breathe: 'In while lowering, out while pushing.' },
  diamond_pu: { why: 'Shifts the work to the triceps (back of the arms) and inner chest.',
    steps: ['Make a diamond with your thumbs and index fingers under your chest.', 'Set a straight body.', 'Lower with elbows brushing your sides.', 'Push back up.'],
    avoid: ['Elbows flaring out', 'Wrists hurting (widen hands slightly)'], breathe: 'In down, out up.' },
  archer_pu: { why: 'Loads one arm more than the other. Builds toward one-arm strength.',
    steps: ['Set hands very wide.', 'Lower toward one hand while the other arm stays straight.', 'Push back to the middle.', 'Alternate sides.'],
    avoid: ['Bending the straight arm', 'Twisting the hips'], breathe: 'In down, out up.' },
  // pull
  db_row: { why: 'Strengthens the upper back and arms, balancing all the pushing and improving posture.',
    steps: ['Put one knee and hand on a bench or chair, back flat.', 'Hold the dumbbell with the other arm hanging straight.', 'Pull your elbow up toward your hip.', 'Pause, then lower slowly. Do all reps, then switch sides.'],
    avoid: ['Rounding the back', 'Twisting the body to lift'], breathe: 'Out as you pull, in as you lower.' },
  table_row: { why: 'Bodyweight pulling for your back and arms when you have no bar.',
    steps: ['Lie under a sturdy table and grip the edge. Test that it cannot tip first.', 'Keep your body straight, heels on the floor.', 'Pull your chest up to the table edge.', 'Lower slowly.'],
    avoid: ['Using a table that wobbles', 'Letting hips sag'], breathe: 'Out as you pull, in as you lower.' },
  dead_hang: { why: 'Builds grip and shoulder health, and decompresses the spine.',
    steps: ['Grip the bar with hands shoulder-width.', 'Lift your feet and hang with arms straight.', 'Keep shoulders slightly active, not up by your ears.', 'Breathe calmly until the time is up.'],
    avoid: ['Swinging', 'Shrugging shoulders into your ears'], breathe: 'Slow, steady breaths through the nose.' },
  neg_pullup: { why: 'Lowering slowly builds pull-up strength before you can do a full one.',
    steps: ['Use a chair or jump to get your chin above the bar.', 'Hold the top for a moment.', 'Lower yourself over 5 seconds until your arms are straight.', 'Step back up and repeat.'],
    avoid: ['Dropping quickly', 'Jumping down from the top'], breathe: 'Breathe out slowly as you lower.' },
  pullup: { why: 'The king of upper-body pulling: back, arms, grip and core.',
    steps: ['Hang with straight arms, hands just wider than shoulders.', 'Pull your shoulder blades down, then pull your chest toward the bar.', 'Get your chin over the bar.', 'Lower all the way to straight arms.'],
    avoid: ['Kicking or swinging', 'Half reps at the bottom'], breathe: 'Out as you pull, in as you lower.' },
  // legs
  bw_squat: { why: 'Strong legs and hips make walking, stairs and getting up easy for life.',
    steps: ['Feet shoulder-width, toes slightly out.', 'Sit your hips back and down like sitting on a low chair.', 'Go until hips are below knees, heels flat.', 'Stand up by pushing the floor away.'],
    avoid: ['Heels lifting', 'Knees caving inward'], breathe: 'In as you go down, out as you stand.' },
  split_squat: { why: 'Trains each leg on its own, fixing imbalances and improving balance.',
    steps: ['Take a long step forward, back heel lifted.', 'Lower straight down until the back knee nearly touches the floor.', 'Keep the front shin close to vertical.', 'Push up through the front foot. Finish one side, then switch.'],
    avoid: ['Front knee collapsing inward', 'Leaning far forward'], breathe: 'In down, out up.' },
  goblet_squat: { why: 'Adds weight to your squat to build strong legs and a solid core.',
    steps: ['Hold the dumbbell upright against your chest.', 'Feet shoulder-width.', 'Squat down between your knees, elbows inside knees at the bottom.', 'Stand tall.'],
    avoid: ['Rounding the back', 'Letting the weight pull you forward'], breathe: 'In down, out up.' },
  bulgarian: { why: 'One of the best single-leg exercises for strength and balance.',
    steps: ['Stand in front of a chair and rest the top of your back foot on it.', 'Lower until the back knee is near the floor.', 'Keep your torso tall or slightly forward.', 'Drive up through the front heel.'],
    avoid: ['Standing too close to the chair', 'Bouncing at the bottom'], breathe: 'In down, out up.' },
  assist_pistol: { why: 'Builds toward the one-leg squat with support for balance.',
    steps: ['Hold a door frame or a yoga belt anchored at a door.', 'Stand on one leg, other leg forward.', 'Squat down slowly on the standing leg.', 'Use your hands as little as possible to stand back up.'],
    avoid: ['Heel lifting', 'Pulling mostly with the arms'], breathe: 'In down, out up.' },
  // core
  dead_bug: { why: 'Teaches your core to protect your lower back. Great for posture.',
    steps: ['Lie on your back, arms up, knees bent at 90° above your hips.', 'Press your lower back into the floor.', 'Slowly lower the opposite arm and leg toward the floor.', 'Return and switch sides.'],
    avoid: ['Lower back lifting off the floor', 'Moving fast'], breathe: 'Breathe out as the arm and leg go out.' },
  plank: { why: 'Builds a strong, stable midsection that protects your spine.',
    steps: ['Forearms on the floor, elbows under shoulders.', 'Legs straight, body in one line from head to heels.', 'Squeeze glutes and pull belly button in.', 'Hold still.'],
    avoid: ['Hips too high or sagging', 'Holding your breath'], breathe: 'Short, steady breaths. Keep breathing.' },
  hollow_hold: { why: 'The core position behind almost every gymnastics skill.',
    steps: ['Lie on your back and press your lower back into the floor.', 'Lift shoulders and legs a little off the floor.', 'Reach arms overhead by your ears.', 'Hold the banana shape. Bend knees to make it easier.'],
    avoid: ['Lower back arching off the floor', 'Neck straining'], breathe: 'Small, steady breaths.' },
  tuck_lsit: { why: 'Builds strong abs, hip flexors and pushing strength in the shoulders.',
    steps: ['Put two bricks or push-up handles beside your hips.', 'Press down with straight arms to lift your hips.', 'Pull your knees up to your chest.', 'Hold, shoulders pushed down away from your ears.'],
    avoid: ['Shrugging', 'Bent arms'], breathe: 'Keep breathing lightly.' },
  lsit: { why: 'A classic skill showing strong abs, hips and shoulders.',
    steps: ['Set up like the tuck L-sit.', 'Straighten your legs out in front, level with the floor.', 'Point your toes.', 'Hold.'],
    avoid: ['Legs dropping', 'Rounding forward'], breathe: 'Short, steady breaths.' },
  // handstand
  pike_pu: { why: 'Strengthens shoulders for overhead pushing. First step to handstand push-ups.',
    steps: ['Start in downward dog: hips high, hands and feet on the floor.', 'Bend your elbows and lower your head toward the floor in front of your hands.', 'Keep hips high.', 'Push back up.'],
    avoid: ['Hips dropping into a push-up', 'Elbows flaring wide'], breathe: 'In down, out up.' },
  elev_pike: { why: 'Puts more bodyweight on the shoulders by raising your feet.',
    steps: ['Feet on a chair, hands on the floor or bricks, hips high.', 'Lower your head toward the floor.', 'Keep the body folded at the hips.', 'Press back up.'],
    avoid: ['Letting hips sink', 'Neck bending hard'], breathe: 'In down, out up.' },
  ctw_hs: { why: 'Builds shoulder strength and the straight body line for a free handstand.',
    steps: ['Face away from the wall in a push-up position, feet at the wall.', 'Walk your feet up the wall and hands toward it.', 'Stop with your belly close to the wall, body straight.', 'Push tall through the shoulders and hold. Walk down slowly.'],
    avoid: ['Banana back', 'Collapsing shoulders'], breathe: 'Keep breathing calmly.' },
  // planche
  pl_lean: { why: 'Builds straight-arm strength in shoulders and wrists for planche skills.',
    steps: ['Start in a push-up position with fingers turned slightly out.', 'Keep arms locked straight.', 'Lean your shoulders forward past your hands.', 'Hold, pushing the floor away.'],
    avoid: ['Bending the elbows', 'Leaning further than your wrists allow'], breathe: 'Small, steady breaths.' },
  crow: { why: 'Balance, wrist strength and focus. You also practise it on Saturday yoga.',
    steps: ['Squat and place hands flat on the floor, shoulder-width.', 'Put your knees high on the backs of your upper arms.', 'Lean forward slowly until your feet lift.', 'Look slightly ahead and hold.'],
    avoid: ['Looking down at your feet', 'Jumping into it'], breathe: 'Calm breaths through the nose.' },
  // accessories
  sl_bridge: { why: 'Strong glutes protect your lower back and knees and help running.',
    steps: ['Lie on your back, one knee bent, other leg straight.', 'Push through the heel to lift your hips.', 'Keep hips level at the top.', 'Lower slowly. Switch sides.'],
    avoid: ['Pushing through the toes', 'Hips twisting'], breathe: 'Out as you lift, in as you lower.' },
  gripper: { why: 'Grip strength helps every hanging and pulling skill and everyday carrying.',
    steps: ['Hold the gripper in one hand.', 'Squeeze until the handles touch.', 'Open slowly.', 'Do all reps, then switch hands.'],
    avoid: ['Half squeezes', 'Letting it snap open'], breathe: 'Breathe normally.' },
}

const TRACK_FALLBACK: Record<string, string> = {
  push: 'An advanced pushing skill. It builds on everything earlier in the push track, so master those first.',
  pull: 'An advanced pulling skill for back, arms and grip. It needs solid pull-ups first.',
  legs: 'An advanced single-leg skill for strength, balance and mobility.',
  core: 'An advanced core skill that needs strong compression and shoulder strength.',
  handstand: 'An advanced overhead skill for shoulders and balance.',
  planche: 'An advanced straight-arm skill. It takes years; wrists and shoulders need to be well prepared.',
}

/** Full guide if written, otherwise a short one built from the exercise's cue. */
export function guideFor(ex: { id: string; name: string; track: string | null; cue: string }): Guide {
  return G[ex.id] ?? {
    why: TRACK_FALLBACK[ex.track ?? ''] ?? 'Supports your main training.',
    steps: [ex.cue, 'Move slowly and stop the set when your form starts to break.'],
    avoid: ['Rushing', 'Training through sharp pain'],
    breathe: 'Keep breathing. Never hold your breath through a whole set.',
  }
}
