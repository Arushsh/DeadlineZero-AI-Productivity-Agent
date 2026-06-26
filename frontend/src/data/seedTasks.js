// src/data/seedTasks.js
// Demo seed tasks shown to first-time users so judges see a populated dashboard.
// These are stored in localStorage and cleared once the user adds their own tasks
// or the backend successfully returns real data.

// Use a fixed but random-looking set of IDs so they remain stable across reloads
const SEED_IDS = [
  'seed-adf3b1c2',
  'seed-8e4c7f91',
  'seed-2d1a9b53',
  'seed-c6f04e28',
]

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

export const SEED_TASKS = [
  {
    id:               SEED_IDS[0],
    user_id:          'demo_user',
    title:            'Submit project report',
    description:      'Final write-up for the software engineering module.',
    deadline:         hoursFromNow(5),          // due in 5 hours — triggers warning toast
    priority:         'critical',
    status:           'pending',
    estimated_minutes: 120,
    tags:             ['study', 'uni'],
    subtasks: [
      { id: 'sub-1a', title: 'Write abstract & introduction', estimated_minutes: 30 },
      { id: 'sub-1b', title: 'Add methodology section',       estimated_minutes: 45 },
      { id: 'sub-1c', title: 'Proofread & format',            estimated_minutes: 45 },
    ],
    reschedule_count: 2,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
  {
    id:               SEED_IDS[1],
    user_id:          'demo_user',
    title:            'Code review — PR #47',
    description:      'Review team member\'s pull request for the auth module.',
    deadline:         hoursFromNow(26),         // due tomorrow
    priority:         'high',
    status:           'in_progress',
    estimated_minutes: 45,
    tags:             ['work', 'code'],
    subtasks:         [],
    reschedule_count: 0,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
  {
    id:               SEED_IDS[2],
    user_id:          'demo_user',
    title:            'Prepare hackathon demo slides',
    description:      '5-minute presentation for Vibe2Ship judges.',
    deadline:         hoursFromNow(72),         // 3 days away
    priority:         'high',
    status:           'pending',
    estimated_minutes: 90,
    tags:             ['hackathon'],
    subtasks:         [],
    reschedule_count: 0,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
  {
    id:               SEED_IDS[3],
    user_id:          'demo_user',
    title:            'Read ML lecture notes',
    description:      'Chapters 4–6 before Friday quiz.',
    deadline:         hoursFromNow(150),        // ~6 days
    priority:         'medium',
    status:           'completed',
    estimated_minutes: 60,
    tags:             ['study'],
    subtasks:         [],
    reschedule_count: 1,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
]

const SEED_KEY = 'dz_seed_loaded'

/** Returns true if seed tasks should be shown (first visit, no real data yet) */
export function shouldShowSeed(realTasks) {
  if (realTasks?.length) return false              // backend returned real tasks
  if (localStorage.getItem(SEED_KEY)) return false // already dismissed
  return true
}

/** Mark seed as acknowledged so it won't re-appear */
export function markSeedSeen() {
  localStorage.setItem(SEED_KEY, '1')
}
