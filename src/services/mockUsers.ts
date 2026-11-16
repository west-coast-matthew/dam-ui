import type { User } from './userService'

const DAY = 86_400_000

/** Seed data for the mock user service. Creation dates are relative to the moment the app loads. */
export function seedUsers(now: number): User[] {
  const rows: [string, string, User['role'], boolean, number][] = [
    // first, last, role, active, days since created
    ['Alex', 'Morgan', 'admin', true, 412],
    ['Priya', 'Natarajan', 'admin', true, 380],
    ['Jordan', 'Okafor', 'editor', true, 301],
    ['Mei', 'Chen', 'editor', true, 266],
    ['Lucas', 'Ferreira', 'viewer', false, 240],
    ['Sofia', 'Lindqvist', 'editor', true, 198],
    ['Daniel', 'Baptiste', 'viewer', true, 151],
    ['Hana', 'Kobayashi', 'editor', true, 122],
    ['Omar', 'Haddad', 'viewer', false, 97],
    ['Grace', "O'Neill", 'viewer', true, 63],
    ['Tomás', 'Álvarez', 'editor', true, 30],
    ['Amara', 'Bello', 'viewer', true, 9],
  ]
  return rows.map(([firstName, lastName, role, active, days], i) => ({
    id: `user-${String(i + 1).padStart(3, '0')}`,
    // The first user is the mock signed-in account.
    username: i === 0 ? 'alex' : `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, ''),
    firstName,
    lastName,
    email: `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@example.com',
    role,
    active,
    createdAt: new Date(now - days * DAY - i * 3_600_000).toISOString(),
  }))
}
